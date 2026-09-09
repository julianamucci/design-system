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
 * aqui, em `docs/shared/chat-docs/`, e nunca ao lado delas.
 *
 * ── UMA IMPLEMENTAÇÃO, CINCO ENDEREÇOS ──
 *
 * As cinco stacks se implantam sozinhas, cada uma no seu domínio, e cada uma
 * serve `/api/perguntar` da PRÓPRIA origem — senão o widget faria pedido entre
 * origens e dependeria do deploy de outra. O que existe cinco vezes é o
 * endereço: `<stack>/api/perguntar.ts` é um reexport de uma linha. O corpo é
 * este arquivo, e é um só.
 *
 * ── O MODELO E A CHAVE ──
 *
 * O chat fala com `google/gemma-4-26b-a4b-it:free` pelo OpenRouter, e a chave é
 * `process.env.CHAT_DOCS_API_KEY`. É um modelo GRATUITO, com cota diária: é
 * decisão de projeto, não configuração de ambiente, e por isso o padrão está no
 * código — ver `MODELO_COMPATIVEL_PADRAO`.
 *
 * Havia um adaptador NATIVO do Google aqui, e ele saiu. Medido: o banco de
 * avaliação não o usava — ele chama `responder`, que usa o provedor
 * configurado —, então o SDK `@google/genai` era importado estaticamente e
 * viajava no pacote das cinco funções sem ninguém exercitá-lo.
 *
 * Trocar isso por menos não fechou porta nenhuma: o Google atende em
 * `https://generativelanguage.googleapis.com/v1beta/openai/`, com a chave do AI
 * Studio como Bearer, pelo mesmo adaptador compatível. Voltar para lá são duas
 * variáveis de ambiente, e não um pacote. O que se perdeu foi o
 * `thinkingLevel: MINIMAL` do SDK nativo, que a camada compatível não expõe.
 *
 * O repositório é PÚBLICO: chave nenhuma entra em código, em comentário, em
 * teste, em exemplo nem em README. Sem ela a função responde `sem_chave` com
 * 503 — um estado tratado, que a interface mostra por escrito. Falhar calado
 * aqui seria pior do que não existir.
 *
 * ── O PROVEDOR ESTÁ ISOLADO ──
 *
 * Só o bloco de chamada conhece o SDK. Tudo o que vem antes — recuperação,
 * montagem do contexto, instrução de sistema — e tudo o que vem depois — o
 * contrato SSE de `sources`, `delta`, `done` e `error` — é agnóstico. Trocar de
 * provedor mexe em um trecho e não toca no cliente, que foi o que aconteceu
 * quando este arquivo saiu da Anthropic para o Google.
 */

import { existsSync, readFileSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { join } from 'node:path';
import {
  RETRIEVAL_FLOOR,
  isWeakRetrieval,
  searchDocs,
  type DocsIndexHit,
} from '../primitives/docs-index';
import { isLocale, loadCorpus, type Locale } from './corpus';

export const config = { runtime: 'nodejs' };

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
 * Tetos do histórico de conversa.
 *
 * O histórico vem do CLIENTE, num endpoint público — ou seja, é entrada de
 * quem chama, não estado do servidor. Sem teto, alguém manda seis turnos de
 * dez mil caracteres e usa o endpoint como proxy barato de modelo, que é
 * exatamente o que o teto da pergunta já impede pelo outro lado.
 *
 * Seis turnos são três pares: o bastante para um "e esse?" algumas perguntas
 * depois, e pouco o suficiente para o custo não crescer sem limite.
 */
export const MAX_HISTORY_TURNS = 6;
export const MAX_HISTORY_CHARS = 4000;

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
function systemPrompt(locale: Locale, weak: boolean, catalogo: string[]): string {
  return [
    'Você responde perguntas sobre o Nortear Design System usando APENAS os trechos de documentação fornecidos nesta conversa.',
    '',
    'REGRAS, em ordem de importância:',
    '',
    '1. NUNCA afirme nada que não esteja escrito nos trechos. Não complete com o que você sabe sobre outras bibliotecas de componentes, não deduza nome de prop, não invente valor de variante, não suponha comportamento. Uma prop inventada faz alguém escrever código errado e culpar o design system.',
    '2. Se os trechos não respondem à pergunta, DIGA QUE NÃO SABE, em uma frase, e aponte o componente mais próximo que apareceu. Não tente responder mesmo assim. Não peça desculpas longas.',
    '3. Toda afirmação diz de qual componente ela veio, entre parênteses e no fim da frase — "(ChatThread)" ou "(chat-thread)", tanto faz, porque os dois identificam sem margem. Sem exceção.',
    '4. Se a pergunta é sobre um componente que não está nos trechos, diga isso em vez de responder pelo componente parecido.',
    '5. NOME DE COMPONENTE VAI SEMPRE EM INGLÊS, exatamente como está no atributo "nome" do documento — ComposerVoice, MediaPlayer, InputOTP. NUNCA traduza o nome, mesmo respondendo em português ou espanhol, e mesmo que o título dentro do documento esteja traduzido: é assim que ele aparece no menu do Storybook, e é por esse nome que a pessoa vai procurar.',
    '6. SÓ existem os componentes desta lista. Nenhum outro nome é componente deste design system, por mais que o texto dos documentos cite conceitos, alternativas e recursos que soem como peça:',
    '',
    catalogo.join(', '),
    '',
    '   Ao citar um componente, use exatamente o nome como está na lista. E só faça AFIRMAÇÕES sobre componentes que têm documento nesta conversa: estar na lista prova que existe, não diz como funciona.',
    '7. NÃO ADIVINHE a que componente uma descrição corresponde. Os documentos citam alternativas por descrição — "botão alternador", "leitura em voz alta", "conversa por voz" — e essas descrições NÃO são nomes de componente. Repita a descrição como o documento a escreveu, sem escolher um nome da lista por conta própria. Mandar a pessoa para a peça errada é pior que deixá-la procurar.',
    '8. Seja curto. Documentação boa cabe em poucos parágrafos. Use listas quando houver itens, e blocos de código só quando o trecho trouxer código.',
    '9. Você não tem acesso a arquivo, rede ou terminal. Não afirme que consultou nada além dos trechos.',
    '',
    weak
      ? 'ATENÇÃO: a recuperação veio FRACA para esta pergunta — nenhum documento passou o piso de confiança. É muito provável que a resposta não esteja no corpus. Comece dizendo que não encontrou, e só então mencione o que apareceu de mais próximo, deixando claro que é um palpite de vizinhança.'
      : 'A recuperação veio com confiança razoável, o que NÃO garante que o documento certo esteja aí. Continue valendo a regra 2.',
    '',
    LANGUAGE_RULE[locale],
  ].join('\n');
}

/**
 * ── O RECORTE DO CONTEXTO, e por que ele é OPÇÃO e não substituição ──
 *
 * MEDIDO: mandar os documentos INTEIROS custa ~33 mil tokens de entrada por
 * pergunta. Isso não é só fatura — é o que fecha a porta de quase todo plano
 * gratuito de provedor compatível com OpenAI (Groq dá 6 mil tokens/min;
 * Cerebras, 30 mil). Nenhum dos dois cabe um documento inteiro.
 *
 * As seções abaixo são as de ALTO SINAL para responder pergunta de
 * documentação: o que o componente é, como se compõe, quando usar, que
 * variantes e estados tem, que props aceita e o que a acessibilidade exige.
 * Ficam de fora `testes`, `analytics`, `seo`, `tokens`, `demonstration`,
 * `related` e `import` — texto que existe para a docs page, não para a
 * resposta. `testes` sozinho é 11,4% do corpus e `tokens` 7,0%, e nenhuma das
 * duas apareceu em resposta nenhuma nas rodadas medidas.
 *
 * `doDont` e `notes` ENTRAM, e o caminho até aqui vale mais que a lista. A única
 * perda da rodada A × B foi "como anuncio erro de formulário?": a resposta
 * recortada cobria `aria-live`, `aria-invalid` e `aria-describedby` — tudo
 * certo — e perdia a regra de ESCRITA, que diz que a mensagem precisa apontar o
 * problema e a correção.
 *
 * A hipótese era que aquilo morava em `doDont`. MEDIDO em três rodadas por
 * configuração, sobre a mesma pergunta: com `doDont`, a regra apareceu em 0 de
 * 3; acrescentando `notes`, em 2 de 3; com o documento inteiro, em 3 de 3.
 * Quem carrega a regra é `notes.tip4` — `doDont` traz o par de exemplos, que é
 * o complemento, não o enunciado.
 *
 * Vale reparar no que isso ensina sobre o corte: a regra JÁ ESTAVA em
 * `usage.guidelines.item4`, que o recorte nunca tirou. Ter o texto não bastou —
 * foi a REPETIÇÃO em `notes` que o trouxe à superfície. Cortar seção não remove
 * só conteúdo; remove reforço.
 *
 * O preço das duas: `doDont` é 2,0% dos caracteres do corpus e `notes`, 5,1%.
 * Somadas, o recorte ainda economiza 35% contra o documento inteiro — a mediana
 * de entrada cai de 23.550 para 15.489 tokens, e o máximo de 39.103 para
 * 22.908. É o máximo que decide se um plano gratuito serve.
 *
 * **O padrão continua sendo o documento inteiro.** Trocar o padrão é decisão de
 * produto, e ela só se toma com número: `src/lib/chat-eval/` é o banco que mede
 * as duas configurações lado a lado. Aqui só existe a chave que liga.
 *
 * A variável é lida NA CHAMADA, e não na carga do módulo, pelo mesmo motivo de
 * `modelo()`: o avaliador roda as duas configurações no mesmo processo.
 */
export const SECOES_DE_ALTO_SINAL = [
  'description',
  'category',
  'type',
  'anatomy',
  'usage',
  'variants',
  'states',
  'props',
  'accessibility',
  'doDont',
  'notes',
] as const;

export function contextoRecortado(): boolean {
  return process.env.CHAT_DOCS_CONTEXTO === 'recortado';
}

/** Só as seções de alto sinal. Seção que o slug não tem simplesmente não entra. */
export function recortarDocumento(documento: unknown): unknown {
  if (!documento || typeof documento !== 'object' || Array.isArray(documento)) return documento;
  const origem = documento as Record<string, unknown>;
  const saida: Record<string, unknown> = {};
  for (const secao of SECOES_DE_ALTO_SINAL) {
    if (origem[secao] !== undefined) saida[secao] = origem[secao];
  }
  return saida;
}

/** Os documentos vencedores, um bloco por slug — inteiros ou recortados. */
/**
 * Siglas que não viram Palavra Capitalizada ao derivar o nome do menu.
 *
 * A barra lateral mostra `InputOTP`, e a derivação ingênua daria `InputOtp`.
 * São poucas, e uma lista curta é mais honesta que uma regra esperta que erra
 * em silêncio.
 */
const SIGLAS: Record<string, string> = { otp: 'OTP' };

/**
 * O nome do componente como ele aparece no menu do Storybook.
 *
 * Derivado do SLUG, e não lido do conteúdo, porque nenhum campo do conteúdo
 * serve: dos 84 componentes, 57 têm o título igual nos três idiomas — é o nome
 * PascalCase — e 27 têm título traduzido: "Ditado por voz" para
 * `composer-voice`, "Grade de atividade" para `activity-graph`.
 *
 * Sem um nome canônico o modelo traduzia o que encontrava, e a resposta citava
 * componentes que não existem em menu nenhum. Pior: misturava nome de
 * componente com CONCEITO tirado da prosa — "Conversa por voz" e "Leitura em
 * voz alta" aparecem no texto do `composer-voice` como alternativas descritas,
 * e voltaram na resposta como se fossem peças do sistema.
 */
export function nomeDeMenu(slug: string): string {
  return slug
    .split('-')
    .map((parte) => SIGLAS[parte] ?? parte.charAt(0).toUpperCase() + parte.slice(1))
    .join('');
}

function buildContext(
  hits: DocsIndexHit[],
  documents: Map<string, unknown>,
): string {
  const recortar = contextoRecortado();
  return hits
    .map((hit) => {
      const bruto = documents.get(hit.slug);
      const document = recortar ? recortarDocumento(bruto) : bruto;
      return [
        // O nome do menu entra no cabeçalho do documento: é o que o modelo tem
        // de usar para se referir ao componente, e precisa estar à vista.
        `<documento nome="${nomeDeMenu(hit.slug)}" slug="${hit.slug}" nota="${hit.score.toFixed(2)}">`,
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

/** Um turno da conversa. `model` é como o provedor chama o assistente. */
interface Turno {
  papel: 'user' | 'model';
  texto: string;
}

/**
 * Aceita só o que tem forma de turno, e corta pelo teto.
 *
 * Nada aqui confia no cliente: o histórico é entrada, como a pergunta. Turno
 * sem papel válido ou sem texto some; o excesso é cortado pelo FIM da lista,
 * mantendo os mais recentes — que são os que a pergunta atual referencia.
 */
function sanearHistorico(bruto: unknown): Turno[] {
  if (!Array.isArray(bruto)) return [];
  const turnos: Turno[] = [];
  for (const item of bruto.slice(-MAX_HISTORY_TURNS)) {
    if (typeof item !== 'object' || item === null) continue;
    const { papel, texto } = item as { papel?: unknown; texto?: unknown };
    if (papel !== 'user' && papel !== 'model') continue;
    if (typeof texto !== 'string' || texto.trim().length === 0) continue;
    turnos.push({ papel, texto: texto.trim() });
  }
  // Orçamento de caracteres, gasto do mais recente para trás.
  let restante = MAX_HISTORY_CHARS;
  const cabem: Turno[] = [];
  for (let i = turnos.length - 1; i >= 0; i--) {
    const custo = turnos[i].texto.length;
    if (custo > restante) break;
    restante -= custo;
    cabem.unshift(turnos[i]);
  }
  return cabem;
}

/**
 * A consulta que vai para a recuperação.
 *
 * MEDIDO, e é a razão de a última pergunta entrar junto: "quais as situações de
 * uso desse" sozinha recupera `progress` com 0,23. Pior — "e quando não usar?"
 * sozinha recupera quatro componentes sem relação nenhuma com nota 3,45, ACIMA
 * do piso, o que produziria uma resposta confiante e errada. Pergunta de
 * continuação não tem termo próprio; ela herda o assunto.
 *
 * Com a pergunta anterior concatenada, as três viram `computer-use` entre 7,9 e
 * 10,2. E a troca de assunto continua funcionando: "e o HoverCard, qual a
 * diferença?" traz `hover-card` na frente, com o assunto antigo em segundo —
 * que é o que uma pergunta de comparação precisa mesmo.
 *
 * Só a ÚLTIMA pergunta entra. Concatenar a conversa inteira faria o assunto do
 * começo puxar todas as respostas seguintes.
 */
function consultaDeRecuperacao(question: string, historico: Turno[]): string {
  const ultimaPergunta = [...historico].reverse().find((t) => t.papel === 'user');
  return ultimaPergunta ? `${ultimaPergunta.texto} ${question}` : question;
}

/** Um evento SSE. Nomeado, para o cliente distinguir sem inspecionar o corpo. */
function sse(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

/**
 * A chave, com uma rede de segurança para desenvolvimento local.
 *
 * Em produção a variável vem do ambiente do projeto na Vercel e o resto deste
 * bloco nunca roda — `.env.local` não existe lá, e o `.gitignore` garante que
 * não vá existir.
 *
 * O bloco existe porque LOCALMENTE o `vercel dev` só injeta o `.env.local` na
 * função quando o projeto está VINCULADO (`.vercel/project.json`). Sem vínculo,
 * a chave está no arquivo, é válida, e ainda assim a função responde
 * `sem_chave` — sintoma que aponta para o lugar errado e faz a pessoa conferir
 * três vezes um arquivo que está certo. Custou uma sessão inteira.
 *
 * Ler o arquivo aqui torna o protótipo independente desse detalhe do CLI. É
 * fallback, e não o caminho: quando a variável já veio do ambiente, nada disto
 * acontece.
 *
 * O valor NUNCA é registrado — nem em log, nem em erro, nem no corpo da
 * resposta.
 *
 * ── POR QUE UMA LISTA, E NÃO "TUDO QUE PARECER VARIÁVEL" ──
 *
 * O arquivo vem de um caminho que ninguém controla: um `.env.local` de máquina
 * pode ter qualquer coisa, e despejar tudo em `process.env` daria a um arquivo
 * local o poder de mexer no comportamento do processo inteiro.
 *
 * A lista cobria só `GEMINI_*`, de quando o Google era o único provedor, e o
 * efeito era sutil: sem vínculo com a Vercel, as `CHAT_DOCS_*` do arquivo eram
 * IGNORADAS, o provedor caía no padrão e o chat respondia — pela outra
 * credencial, sem nada na tela dizendo isso.
 */
const VARIAVEIS_DO_CHAT = [
  'CHAT_DOCS_PROVEDOR',
  'CHAT_DOCS_API_KEY',
  'CHAT_DOCS_MODELO',
  'CHAT_DOCS_BASE_URL',
] as const;

let envLocalCarregado = false;

/**
 * Copia o `.env.local` da stack para `process.env`, uma vez por processo.
 *
 * `??=` em cada nome: o que já veio do ambiente de verdade SEMPRE vence. O
 * arquivo é rede, nunca autoridade.
 */
function carregarEnvLocal(): void {
  if (envLocalCarregado) return;
  // Saída explícita, para o teste conseguir reproduzir o estado "sem chave".
  // Sem ela, a rede de segurança acharia o `.env.local` da máquina de quem roda
  // a suíte e o estado que a pessoa vê PRIMEIRO ficaria sem portão nenhum.
  if (process.env.NORTEAR_IGNORAR_ENV_LOCAL === '1') {
    envLocalCarregado = true;
    return;
  }
  envLocalCarregado = true;

  // O `.env.local` é POR STACK — cada uma se implanta sozinha, com o seu
  // próprio domínio. Este módulo é compartilhado e não tem como saber de qual
  // stack partiu a chamada; quem sabe é o processo. Em `vercel dev` o
  // diretório de trabalho é a raiz da stack, que é exatamente o que se quer.
  //
  // Não há candidato relativo a ESTE arquivo de propósito: daqui,
  // `docs/shared/chat-docs/`, todo caminho para uma stack teria de nomear uma
  // delas — e um módulo compartilhado que nomeia uma stack é o começo da
  // divergência.
  const arquivo = join(process.cwd(), '.env.local');
  if (!existsSync(arquivo)) return;

  for (const linha of readFileSync(arquivo, 'utf8').split(/\r?\n/)) {
    const casa = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(linha);
    if (!casa) continue;
    const nome = casa[1] as (typeof VARIAVEIS_DO_CHAT)[number];
    if (!VARIAVEIS_DO_CHAT.includes(nome)) continue;
    // Aspas em volta são convenção comum de arquivo .env e não fazem parte do
    // valor. Sem tirá-las, a chave viaja com aspas e a API recusa — outro
    // sintoma que aponta para o lugar errado. Vale igual para o NOME do modelo:
    // com aspas ele vira um modelo que não existe, e a resposta é um 404 que
    // acusa o modelo em vez do arquivo.
    const valor = casa[2].trim().replace(/^(['"])(.*)\1$/, '$2');
    if (!valor) continue;
    process.env[nome] ??= valor;
  }
}

/* ── PONTO DE EXTENSÃO: O PROVEDOR ───────────────────────────────────────── */

/**
 * ── COMO LIGAR OUTRO PROVEDOR ──
 *
 * Groq, Cerebras, OpenRouter, Together e praticamente todo servidor local
 * (Ollama, llama.cpp, vLLM, LM Studio) falam o MESMO protocolo: `POST` em
 * `/v1/chat/completions` com `stream: true`, no corpo da OpenAI. Ou seja: UM
 * adaptador serve para todos eles, e o que muda de um para o outro é a URL
 * base, o nome do modelo e a variável que guarda a chave.
 *
 * Ligar um é duas coisas, e nenhuma delas toca o cliente:
 *
 * 1. Escrever um `Provedor` — as quatro funções abaixo.
 * 2. Registrar em `PROVEDORES` e apontar `CHAT_DOCS_PROVEDOR` para ele.
 *
 * O adaptador compatível com OpenAI NÃO existe aqui de propósito: não há chave
 * de nenhum desses serviços neste repositório, e código de integração que
 * ninguém consegue exercitar é código que nasce quebrado e passa verde no
 * portão — exatamente o defeito que a regra "portão só vale depois de saber o
 * que ele cobre" descreve.
 *
 * O que a interface garante, e é por isso que ela existe: nem a recuperação,
 * nem a montagem do contexto, nem a instrução de sistema, nem o contrato SSE
 * (`sources`, `delta`, `done`, `error`) sabem qual provedor respondeu. Foi
 * assim que este arquivo saiu da Anthropic para o Google sem o cliente mudar
 * uma linha.
 *
 * **O recorte de contexto é o que torna a troca viável de verdade.** Groq
 * entrega 6 mil tokens por minuto no plano gratuito e Cerebras entrega 30 mil:
 * com documento inteiro (~33 mil), UMA pergunta já estoura a cota dos dois. Por
 * isso o adaptador vem junto de `CHAT_DOCS_CONTEXTO=recortado`, e não antes.
 */

/** O que o núcleo pede ao provedor. Nada aqui é específico de um SDK. */
export interface PedidoAoProvedor {
  /** A instrução de sistema já montada, com catálogo e regra de idioma. */
  sistema: string;
  /** Os turnos anteriores, do mais antigo para o mais recente. */
  historico: readonly Turno[];
  /** A última mensagem do usuário — trechos recuperados + pergunta. */
  mensagem: string;
  maxTokens: number;
  temperatura: number;
}

/** O que o provedor devolve, pedaço a pedaço. Só o último traz `uso`. */
export interface PedacoDoProvedor {
  texto?: string;
  /**
   * O modelo que o provedor diz ter servido.
   *
   * Existe porque nome pedido e modelo servido PODEM DIVERGIR, e a divergência
   * é silenciosa: um agregador aceita o identificador, responde bem, e a
   * avaliação atribui o resultado ao modelo errado. Sem este campo, um banco de
   * comparação mede reputação em vez de medir modelo.
   */
  modeloServido?: string;
  parada?: string | null;
  uso?: { input: number | null; output: number | null };
}

/** Os códigos que o cliente já trata. Trocar de provedor não pode inventar outro. */
export type CodigoDeFalha =
  | 'modelo_indisponivel'
  | 'chave_invalida'
  | 'limite_do_modelo'
  | 'falha_do_modelo';

export interface Provedor {
  /** Só para leitura humana. Não vai para o cliente. */
  nome: string;
  /**
   * O NOME da variável de ambiente que guarda a credencial deste provedor.
   *
   * Existe para a mensagem de `sem_chave` poder dizer qual conferir. Antes o
   * nome era cravado no texto, e mandava quem configurou olhar a variável
   * errada sempre que o provedor não fosse aquele.
   */
  nomeDaChave: string;
  /**
   * A credencial, ou `null` quando não há.
   *
   * NUNCA registre o valor — nem em log de depuração. O repositório é público.
   */
  chave(): string | null;
  /** O streaming. É a ÚNICA função que conhece SDK, URL ou `fetch`. */
  stream(pedido: PedidoAoProvedor, chave: string): AsyncIterable<PedacoDoProvedor>;
  /** Traduz o erro do provedor para um código que o cliente já sabe mostrar. */
  classificarFalha(erro: unknown): CodigoDeFalha;
}

/**
 * O registro. Um adaptador novo entra aqui, e em nenhum outro lugar.
 *
 * Nome desconhecido cai no Gemini de propósito: derrubar a função porque
 * alguém digitou errado uma variável de ambiente troca um defeito de
 * configuração por uma indisponibilidade.
 */
/**
 * ─── Adaptador compatível com a API da OpenAI ────────────────────────────────
 *
 * Um só cobre OpenRouter, Groq, Cerebras, Together e a maioria dos servidores
 * locais: todos falam `POST /chat/completions` com streaming em SSE. O que muda
 * entre eles é a URL base e a chave, e as duas vêm do ambiente.
 *
 * Serve para o que o banco de avaliação precisa: com uma chave do OpenRouter, o
 * MODELO vira uma string, e medir um candidato é `CHAT_DOCS_MODELO=<nome>` mais
 * uma rodada.
 *
 * `stream_options: { include_usage: true }` NÃO é detalhe. Sem ele a maioria
 * dos servidores compatíveis não manda contagem de tokens nenhuma em modo
 * streaming: o evento `done` sai com `null`, e o critério de custo do banco
 * passa a medir nada — portão sem dentes, que é o defeito que esta sessão já
 * encontrou quatro vezes.
 */
const BASE_PADRAO = 'https://openrouter.ai/api/v1';

/**
 * O modelo do chat. A decisão está AQUI, e não só no ambiente.
 *
 * Gratuito, com cota DIÁRIA — é o que o aviso dentro do painel diz a quem
 * pergunta, e é por isso que a mensagem de 429 manda voltar amanhã em vez de
 * tentar de novo em instantes.
 *
 * Ser o padrão do código, e não apenas um valor de `.env`, corrige uma
 * armadilha medida: enquanto o padrão apontava para outro provedor, um ambiente
 * sem as variáveis caía silenciosamente naquele outro — respondendo, mas não
 * pelo motivo que quem configurou imaginava. Padrão que contradiz a decisão não
 * é conservador, é enganoso.
 */
export const MODELO_COMPATIVEL_PADRAO = 'google/gemma-4-26b-a4b-it:free';

const provedorCompativelOpenAI: Provedor = {
  nome: 'openai-compat',
  nomeDaChave: 'CHAT_DOCS_API_KEY',

  chave() {
    carregarEnvLocal();
    return process.env.CHAT_DOCS_API_KEY ?? null;
  },

  async *stream(pedido, chave) {
    const base = (process.env.CHAT_DOCS_BASE_URL ?? BASE_PADRAO).replace(/\/+$/, '');
    const resposta = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${chave}`,
      },
      body: JSON.stringify({
        model: process.env.CHAT_DOCS_MODELO ?? MODELO_COMPATIVEL_PADRAO,
        stream: true,
        stream_options: { include_usage: true },
        max_tokens: pedido.maxTokens,
        temperature: pedido.temperatura,
        messages: [
          { role: 'system', content: pedido.sistema },
          ...pedido.historico.map((turno) => ({
            // O protocolo da OpenAI chama de `assistant` o que o Google chama
            // de `model`. É a única diferença de vocabulário entre os dois.
            role: turno.papel === 'model' ? 'assistant' : 'user',
            content: turno.texto,
          })),
          { role: 'user', content: pedido.mensagem },
        ],
      }),
    });

    if (!resposta.ok || !resposta.body) {
      // O corpo do erro pode carregar detalhe de conta — fica no log do
      // servidor, como no outro adaptador. Só o status atravessa.
      const detalhe = await resposta.text().catch(() => '');
      console.error('[perguntar] provedor compatível recusou', resposta.status, detalhe.slice(0, 400));
      throw Object.assign(new Error('provedor recusou'), { status: resposta.status });
    }

    const leitor = resposta.body.getReader();
    const decodificador = new TextDecoder();
    let sobra = '';
    let parada: string | null = null;
    let modeloRelatado: string | undefined;
    let uso: { input: number | null; output: number | null } | undefined;

    for (;;) {
      const { done, value } = await leitor.read();
      if (done) break;
      sobra += decodificador.decode(value, { stream: true });

      // O SSE separa eventos por linha em branco; o resto fica para a próxima
      // volta. Cortar no `\n` simples partiria um JSON no meio.
      const blocos = sobra.split('\n\n');
      sobra = blocos.pop() ?? '';

      for (const bloco of blocos) {
        const linha = bloco.split('\n').find((l) => l.startsWith('data:'));
        if (!linha) continue;
        const dado = linha.slice(5).trim();
        if (dado === '[DONE]') continue;

        let evento: {
          model?: string;
          choices?: { delta?: { content?: string }; finish_reason?: string | null }[];
          usage?: { prompt_tokens?: number; completion_tokens?: number };
        };
        try {
          evento = JSON.parse(dado);
        } catch {
          // Comentário de keep-alive ou pedaço malformado: seguir é melhor que
          // derrubar a resposta inteira por uma linha.
          continue;
        }

        if (evento.model && evento.model !== modeloRelatado) {
          modeloRelatado = evento.model;
          yield { modeloServido: evento.model };
        }
        const texto = evento.choices?.[0]?.delta?.content;
        if (texto) yield { texto };
        if (evento.choices?.[0]?.finish_reason) parada = evento.choices[0].finish_reason ?? null;
        if (evento.usage) {
          uso = {
            input: evento.usage.prompt_tokens ?? null,
            output: evento.usage.completion_tokens ?? null,
          };
        }
      }
    }

    yield { parada, uso };
  },

  classificarFalha(erro) {
    // Sem classe de erro aqui — o `fetch` não lança por status, então o status
    // vem pendurado no erro que o `stream` levantou.
    const status = (erro as { status?: number })?.status ?? 0;
    if (status === 404) return 'modelo_indisponivel';
    if (status === 401 || status === 403 || status === 400) return 'chave_invalida';
    if (status === 429) return 'limite_do_modelo';
    return 'falha_do_modelo';
  },
};

const PROVEDORES: Record<string, Provedor> = {
  openrouter: provedorCompativelOpenAI,
  // Mesmo adaptador, nomes diferentes: o que muda é `CHAT_DOCS_BASE_URL`.
  compativel: provedorCompativelOpenAI,
};

function provedorAtual(): Provedor {
  // Antes de LER a escolha: sem isto, um ambiente local sem vínculo com a
  // Vercel decidiria o provedor com as variáveis ainda não carregadas.
  carregarEnvLocal();
  // O padrão é o OpenRouter, que é onde vive o modelo gratuito escolhido.
  //
  // Nome desconhecido cai no adaptador compatível de propósito: derrubar a
  // função porque alguém digitou errado uma variável de ambiente troca um
  // defeito de configuração por uma indisponibilidade.
  return PROVEDORES[process.env.CHAT_DOCS_PROVEDOR ?? 'openrouter'] ?? provedorCompativelOpenAI;
}

/**
 * O núcleo, no padrão Web: recebe `Request`, devolve `Response`.
 *
 * Fica exportado à parte porque é ele que dá para exercitar sem servidor — a
 * sonda chama esta função direto e mede os estados. O `export default` abaixo é
 * só a casca que traduz para a forma que o runtime da Vercel entrega.
 */
export async function responder(request: Request): Promise<Response> {
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
  // O teto do CORPO cresceu com o histórico. Continua sendo a primeira defesa:
  // recusa pelo tamanho antes de gastar memória com o parse.
  if (raw.length > MAX_QUESTION_LENGTH * 4 + MAX_HISTORY_CHARS) {
    return jsonError(413, 'corpo_grande', 'Corpo grande demais.');
  }

  let body: { pergunta?: unknown; locale?: unknown; historico?: unknown };
  try {
    body = JSON.parse(raw) as { pergunta?: unknown; locale?: unknown; historico?: unknown };
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
      'O conteúdo compartilhado não subiu junto com a função. Ver o cabeçalho de docs/shared/chat-docs/corpus.ts.',
    );
  }

  // O catálogo inteiro no prompt custa ~275 tokens (1% do total) e é o que
  // permite ao modelo distinguir COMPONENTE de conceito citado na prosa. Sem
  // ele, a resposta mandava "use o Button" onde o texto dizia "botão
  // alternador" — que é o Toggle, e o Button nem tinha documento na conversa.
  const catalogo = corpus.entries.map((entrada) => nomeDeMenu(entrada.slug)).sort();

  const historico = sanearHistorico(body.historico);
  const hits = searchDocs(corpus.entries, consultaDeRecuperacao(question, historico), {
    limit: MAX_DOCUMENTS,
  });
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
  const provedor = provedorAtual();
  const apiKey = provedor.chave();
  if (!apiKey) {
    return jsonError(
      503,
      'sem_chave',
      // O NOME sai do provedor ativo. Cravar um nome aqui mandava quem
      // configurou conferir a variável errada — e depois que o padrão passou a
      // ser o OpenRouter, mandaria isso na maioria das vezes.
      `${provedor.nomeDaChave} não está configurada no ambiente desta função.`,
    );
  }

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
        // Daqui para baixo o núcleo NÃO sabe qual provedor respondeu: só o
        // contrato de pedaços. É o que permite ligar um servidor compatível
        // com OpenAI escrevendo o adaptador e nada mais.
        for await (const pedaco of provedor.stream(
          {
            sistema: systemPrompt(locale, weak, catalogo),
            historico,
            mensagem: [
              'Trechos da documentação recuperados para esta pergunta:',
              '',
              buildContext(selected, corpus.documents),
              '',
              'Pergunta:',
              question,
            ].join('\n'),
            maxTokens: MAX_TOKENS,
            temperatura: 0.2,
          },
          apiKey,
        )) {
          if (pedaco.texto) send('delta', { text: pedaco.texto });
          // O pedaço final é o que traz `uso`. Ele fecha o SSE com `done`, que
          // é onde o avaliador de custo lê os tokens de entrada e de saída.
          if (pedaco.uso) {
            send('done', { stopReason: pedaco.parada ?? null, usage: pedaco.uso });
          }
        }
      } catch (error) {
        // O texto do erro da API pode carregar detalhe de conta. O cliente
        // recebe a categoria; o detalhe fica no log do servidor.
        console.error('[perguntar] falha ao chamar a API', error);
        send('error', { code: provedor.classificarFalha(error) });
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

/* ── A casca que o runtime da Vercel espera ────────────────────────────────── */

/**
 * POR QUE ESTA CASCA EXISTE
 *
 * `runtime: 'nodejs'` entrega `(req, res)` do Node — `IncomingMessage` e
 * `ServerResponse` —, e não o par `Request`/`Response` da Web. Escrito no padrão
 * Web, o handler quebrava na primeira linha que lia cabeçalho:
 * `request.headers.get is not a function`.
 *
 * O runtime `edge` entregaria `Request` e dispensaria esta casca. Não serve
 * aqui: `corpus.ts` lê `docs/shared/content/` do disco com `node:fs`, e o edge
 * não tem sistema de arquivos. Entre reescrever a leitura do corpus e traduzir
 * a borda, traduzir a borda é o trabalho menor — e mantém o núcleo testável sem
 * servidor nenhum.
 */
/** O corpo inteiro, como texto. Já limitado por `MAX_QUESTION_LENGTH` adiante. */
function lerCorpo(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const pedacos: Buffer[] = [];
    req.on('data', (pedaco: Buffer) => pedacos.push(pedaco));
    req.on('end', () => resolve(Buffer.concat(pedacos).toString('utf8')));
    req.on('error', reject);
  });
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  const metodo = req.method ?? 'GET';
  const cabecalhos = new Headers();
  for (const [nome, valor] of Object.entries(req.headers)) {
    if (valor === undefined) continue;
    cabecalhos.set(nome, Array.isArray(valor) ? valor.join(', ') : valor);
  }

  // A URL precisa ser absoluta para o construtor de `Request`. O host não é
  // usado por nada aqui — só o método, os cabeçalhos e o corpo.
  const request = new Request(`http://local${req.url ?? '/'}`, {
    method: metodo,
    headers: cabecalhos,
    body: metodo === 'GET' || metodo === 'HEAD' ? undefined : await lerCorpo(req),
  });

  const response = await responder(request);

  res.writeHead(response.status, Object.fromEntries(response.headers));
  // Cabeçalho na frente do primeiro byte: sem isto o Node segura tudo até o
  // primeiro `write` grande, e o SSE — que existe justamente para chegar aos
  // poucos — só apareceria no fim. Streaming que só entrega no fim é o mesmo
  // que não ter streaming.
  res.flushHeaders();

  if (!response.body) {
    res.end();
    return;
  }

  const leitor = response.body.getReader();
  try {
    for (;;) {
      const { done, value } = await leitor.read();
      if (done) break;
      res.write(value);
    }
  } finally {
    res.end();
  }
}
