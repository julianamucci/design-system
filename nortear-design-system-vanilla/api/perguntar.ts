/**
 * ─── Conversar com a documentação — a função de servidor ─────────────────────
 *
 * Recebe `{ pergunta, locale }`, roda a recuperação léxica sobre o conteúdo
 * compartilhado, monta o prompt com os documentos vencedores INTEIROS, chama o
 * modelo com streaming e devolve por SSE.
 *
 * ── POR QUE ISTO NÃO É UM COMPONENTE ──
 *
 * `docs/shared/guidelines/17-componentes-conversacionais.md` §2: o design
 * system não tem runtime de conversa, e não vai ter. Nenhuma peça de
 * `src/components/ui/` faz `fetch`, abre `WebSocket`, lê `localStorage` ou
 * agenda relógio de negócio. O chat é uma APLICAÇÃO que consome as peças — mora
 * aqui e em `.storybook/`, e nunca ao lado delas.
 *
 * ── A CHAVE ──
 *
 * `process.env.GEMINI_API_KEY`, e só — a chave do Google AI Studio. O
 * repositório é PÚBLICO: ela não entra em código, em comentário, em teste, em
 * exemplo nem em README. Sem ela a função responde `sem_chave` com 503 — um
 * estado tratado, que a interface mostra por escrito. Falhar calado aqui seria
 * pior do que não existir.
 *
 * ── O PROVEDOR ESTÁ ISOLADO ──
 *
 * Só o bloco de chamada conhece o SDK. Tudo o que vem antes — recuperação,
 * montagem do contexto, instrução de sistema — e tudo o que vem depois — o
 * contrato SSE de `sources`, `delta`, `done` e `error` — é agnóstico. Trocar de
 * provedor mexe em um trecho e não toca no cliente, que foi o que aconteceu
 * quando este arquivo saiu da Anthropic para o Google.
 */

import { GoogleGenAI, ApiError } from '@google/genai';
import {
  RETRIEVAL_FLOOR,
  isWeakRetrieval,
  searchDocs,
  type DocsIndexHit,
} from '../../docs/shared/primitives/docs-index';
import { isLocale, loadCorpus, type Locale } from './corpus';

export const config = { runtime: 'nodejs' };

/**
 * O modelo, com o nome vindo do ambiente.
 *
 * A tarefa é ler trecho e responder, não deliberar: um modelo rápido da linha
 * Flash dá conta e custa uma fração de um modelo de raciocínio. O padrão é um
 * ponto de partida — **confira em aistudio.google.com quais modelos a sua chave
 * alcança**, porque a lista muda mais rápido que este arquivo e um nome que não
 * existe volta como `falha_do_modelo` sem dizer que o nome é o problema.
 */
const MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash';

/** Teto da resposta. Uma resposta de documentação que passa disto está errada de escopo. */
const MAX_TOKENS = 4000;

/**
 * Quantos documentos entram no prompt. Inteiros, e por isso poucos.
 *
 * MEDIDO: o documento mediano tem ~22 mil caracteres, e cinco deles somam
 * ~31,5 mil tokens de entrada — dois terços do custo de cada pergunta. Mandar
 * sempre cinco é desperdício quando a recuperação foi CATEGÓRICA: em "quais
 * variantes o Alert tem?" o primeiro pontua 15,7 e o quarto pontua 1,4, e o
 * quarto não vai contribuir com nada.
 *
 * Daí a banda: entra quem chegar a uma fração da nota do primeiro, com piso de
 * três (para o modelo poder comparar e dizer "não é este, é aquele") e teto de
 * cinco. É a única decisão de custo do arquivo, e ela usa a nota que a
 * recuperação já calculou em vez de um número fixo.
 */
const MAX_DOCUMENTS = 5;
const MIN_DOCUMENTS = 3;
const SCORE_BAND = 0.15;

/**
 * Teto do tamanho da pergunta, em caracteres.
 *
 * Não é conforto de interface: é o que impede alguém de usar o endpoint público
 * como um proxy de LLM barato, colando dez mil palavras no campo. O composer da
 * interface declara o mesmo número, para a pessoa ver o limite antes de bater
 * nele.
 */
export const MAX_QUESTION_LENGTH = 600;

/**
 * ── Limite de taxa: isto é PISO, não solução ──
 *
 * Janela deslizante em memória de módulo, por IP. O que ele pega: a aba que
 * dispara em laço, o script ingênuo, o clique nervoso.
 *
 * O que ele NÃO pega, e é honesto dizer com todas as letras:
 *
 * 1. **A memória é da instância.** A Vercel escala horizontalmente e recicla
 *    instância; N instâncias significam N vezes o limite, e um cold start zera
 *    a contagem. Não existe estado compartilhado aqui.
 * 2. **O IP vem de cabeçalho.** `x-forwarded-for` é o que o proxy da frente
 *    escreveu; atrás dele há CGNAT (um escritório inteiro num IP) e IPv6 com
 *    /64 de sobra por assinante (um atacante troca de IP à vontade).
 * 3. **Não há custo por token.** Dez perguntas curtas e dez perguntas no teto
 *    contam igual, e não é isso que a fatura mede.
 *
 * O que resolveria: contador compartilhado (KV/Redis) com chave por identidade
 * e não por IP, orçamento em TOKENS e não em requisições, e um teto de gasto
 * diário na conta do Google AI Studio — a única defesa que não depende de nada
 * que este processo saiba.
 */
const RATE_WINDOW_MS = 60_000;
const RATE_MAX_PER_WINDOW = 8;
const rateLog = new Map<string, number[]>();

function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') ?? 'desconhecido';
}

function overRateLimit(ip: string): boolean {
  const now = Date.now();
  const recent = (rateLog.get(ip) ?? []).filter((at) => now - at < RATE_WINDOW_MS);
  if (recent.length >= RATE_MAX_PER_WINDOW) {
    rateLog.set(ip, recent);
    return true;
  }
  recent.push(now);
  rateLog.set(ip, recent);
  // Poda: sem isto o mapa cresce por IP visto, para sempre.
  if (rateLog.size > 5_000) {
    for (const [key, stamps] of rateLog) {
      if (stamps.every((at) => now - at >= RATE_WINDOW_MS)) rateLog.delete(key);
    }
  }
  return false;
}

/** Como cada língua pede a resposta. O corpus é trilíngue; a resposta acompanha. */
const LANGUAGE_RULE: Record<Locale, string> = {
  'pt-BR': 'Responda em português do Brasil.',
  en: 'Answer in English.',
  es: 'Responde en español.',
};

/**
 * ── A instrução de sistema, e as duas obrigações que ela carrega ──
 *
 * 1. **Só o que está nos trechos.** Uma prop inventada faz alguém escrever
 *    código que não compila e culpar o design system. O modelo sabe muita coisa
 *    sobre bibliotecas de componentes em geral, e é justamente esse
 *    conhecimento que produziria a resposta plausível e errada.
 * 2. **Dizer que não sabe.** A recuperação léxica erra — a colisão medida em
 *    `docs-index.ts` mostra um caso em que ela erra com nota razoável. O sinal
 *    `recuperação FRACA` chega no prompt, e a saída obrigatória para ele é
 *    admitir que não achou.
 *
 * Mais: toda afirmação cita de qual componente veio. É o que permite a quem lê
 * conferir — e é o que torna a citação verificável em vez de decorativa.
 */
function systemPrompt(locale: Locale, weak: boolean): string {
  return [
    'Você responde perguntas sobre o Nortear Design System usando APENAS os trechos de documentação fornecidos nesta conversa.',
    '',
    'REGRAS, em ordem de importância:',
    '',
    '1. NUNCA afirme nada que não esteja escrito nos trechos. Não complete com o que você sabe sobre outras bibliotecas de componentes, não deduza nome de prop, não invente valor de variante, não suponha comportamento. Uma prop inventada faz alguém escrever código errado e culpar o design system.',
    '2. Se os trechos não respondem à pergunta, DIGA QUE NÃO SABE, em uma frase, e aponte o componente mais próximo que apareceu. Não tente responder mesmo assim. Não peça desculpas longas.',
    '3. Toda afirmação diz de qual componente ela veio, pelo nome do slug — por exemplo "(chat-thread)". Sem exceção.',
    '4. Se a pergunta é sobre um componente que não está nos trechos, diga isso em vez de responder pelo componente parecido.',
    '5. Seja curto. Documentação boa cabe em poucos parágrafos. Use listas quando houver itens, e blocos de código só quando o trecho trouxer código.',
    '6. Você não tem acesso a arquivo, rede ou terminal. Não afirme que consultou nada além dos trechos.',
    '',
    weak
      ? 'ATENÇÃO: a recuperação veio FRACA para esta pergunta — nenhum documento passou o piso de confiança. É muito provável que a resposta não esteja no corpus. Comece dizendo que não encontrou, e só então mencione o que apareceu de mais próximo, deixando claro que é um palpite de vizinhança.'
      : 'A recuperação veio com confiança razoável, o que NÃO garante que o documento certo esteja aí. Continue valendo a regra 2.',
    '',
    LANGUAGE_RULE[locale],
  ].join('\n');
}

/** Os documentos vencedores, inteiros, um bloco por slug. */
function buildContext(
  hits: DocsIndexHit[],
  documents: Map<string, unknown>,
): string {
  return hits
    .map((hit) => {
      const document = documents.get(hit.slug);
      return [
        `<documento slug="${hit.slug}" nota="${hit.score.toFixed(2)}">`,
        JSON.stringify(document, null, 1),
        '</documento>',
      ].join('\n');
    })
    .join('\n\n');
}

function jsonError(status: number, code: string, message: string): Response {
  return new Response(JSON.stringify({ code, message }), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

/** Um evento SSE. Nomeado, para o cliente distinguir sem inspecionar o corpo. */
function sse(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return jsonError(405, 'metodo', 'Use POST.');
  }

  if (overRateLimit(clientIp(request))) {
    return jsonError(
      429,
      'limite_de_taxa',
      `Muitas perguntas em pouco tempo. Espere um minuto — o limite é ${RATE_MAX_PER_WINDOW} por minuto.`,
    );
  }

  // Corpo lido como texto ANTES de virar JSON: é o que permite recusar pelo
  // tamanho sem gastar memória com o parse de um corpo grande de propósito.
  const raw = await request.text();
  if (raw.length > MAX_QUESTION_LENGTH * 4) {
    return jsonError(413, 'corpo_grande', 'Corpo grande demais.');
  }

  let body: { pergunta?: unknown; locale?: unknown };
  try {
    body = JSON.parse(raw) as { pergunta?: unknown; locale?: unknown };
  } catch {
    return jsonError(400, 'json_invalido', 'Corpo não é JSON.');
  }

  const question = typeof body.pergunta === 'string' ? body.pergunta.trim() : '';
  if (question.length === 0) {
    return jsonError(400, 'pergunta_vazia', 'Falta a pergunta.');
  }
  if (question.length > MAX_QUESTION_LENGTH) {
    return jsonError(
      413,
      'pergunta_longa',
      `A pergunta passa de ${MAX_QUESTION_LENGTH} caracteres.`,
    );
  }

  const locale: Locale = isLocale(body.locale) ? body.locale : 'pt-BR';

  const corpus = loadCorpus(locale);
  if (!corpus) {
    return jsonError(
      503,
      'sem_corpus',
      'O conteúdo compartilhado não subiu junto com a função. Ver o cabeçalho de api/corpus.ts.',
    );
  }

  const hits = searchDocs(corpus.entries, question, { limit: MAX_DOCUMENTS });
  const weak = isWeakRetrieval(hits);
  // Mesmo fraca, os melhores vão no prompt: é o que permite ao modelo dizer
  // "não achei, mas o mais próximo foi X" em vez de um silêncio sem pista.
  const best = hits[0]?.score ?? 0;
  const inBand = hits.filter((hit) => hit.score >= best * SCORE_BAND).length;
  const selected = hits.slice(
    0,
    Math.min(MAX_DOCUMENTS, Math.max(MIN_DOCUMENTS, inBand), hits.length),
  );

  // A chave é lida AQUI, e nunca sai daqui: não vai para o log, não vai para o
  // corpo, não vai para o cliente.
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return jsonError(
      503,
      'sem_chave',
      'GEMINI_API_KEY não está configurada no ambiente desta função.',
    );
  }

  const client = new GoogleGenAI({ apiKey });
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: unknown) =>
        controller.enqueue(encoder.encode(sse(event, data)));

      // As fontes saem ANTES do primeiro token: quem lê vê de onde a resposta
      // vem enquanto ela ainda está sendo escrita, e não depois.
      send('sources', {
        weak,
        floor: RETRIEVAL_FLOOR,
        hits: selected.map((hit) => ({ slug: hit.slug, score: Number(hit.score.toFixed(3)) })),
      });

      try {
        const modelStream = await client.models.generateContentStream({
          model: MODEL,
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: [
                    'Trechos da documentação recuperados para esta pergunta:',
                    '',
                    buildContext(selected, corpus.documents),
                    '',
                    'Pergunta:',
                    question,
                  ].join('\n'),
                },
              ],
            },
          ],
          config: {
            systemInstruction: systemPrompt(locale, weak),
            maxOutputTokens: MAX_TOKENS,
            // Temperatura baixa porque a resposta precisa ficar colada nos
            // trechos: aqui invenção não é criatividade, é defeito.
            temperature: 0.2,
            // Sem raciocínio estendido. A tarefa é ler trecho e responder; o
            // orçamento de pensamento aqui só adicionaria custo e latência.
            thinkingConfig: { thinkingBudget: 0 },
          },
        });

        // O uso vem no ÚLTIMO pedaço, e não num objeto final separado: quem
        // quiser contabilizar precisa guardar o que passou, porque depois do
        // laço não há mais nada para consultar.
        let ultimo: Awaited<ReturnType<typeof modelStream.next>>['value'] | undefined;

        for await (const chunk of modelStream) {
          ultimo = chunk;
          const texto = chunk.text;
          if (texto) send('delta', { text: texto });
        }

        send('done', {
          stopReason: ultimo?.candidates?.[0]?.finishReason ?? null,
          usage: {
            input: ultimo?.usageMetadata?.promptTokenCount ?? null,
            output: ultimo?.usageMetadata?.candidatesTokenCount ?? null,
          },
        });
      } catch (error) {
        // O texto do erro da API pode carregar detalhe de conta. O cliente
        // recebe a categoria; o detalhe fica no log do servidor.
        console.error('[perguntar] falha ao chamar a API', error);
        // O SDK do Google traz o código HTTP no erro em vez de uma classe por
        // categoria: 401 e 403 são chave, 429 é limite. O 400 entra em
        // `chave_invalida` de propósito — é o que volta quando o NOME DO MODELO
        // não existe para aquela chave, e mandar a pessoa conferir a chave e o
        // modelo é mais útil que um "falhou" genérico.
        const status = error instanceof ApiError ? error.status : 0;
        const code =
          status === 401 || status === 403 || status === 400
            ? 'chave_invalida'
            : status === 429
              ? 'limite_do_modelo'
              : 'falha_do_modelo';
        send('error', { code });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-store',
      connection: 'keep-alive',
    },
  });
}
