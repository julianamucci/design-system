/**
 * ─── O avaliador: roda o banco contra a API de verdade ───────────────────────
 *
 * COMO RODAR
 *
 * ```
 * cd nortear-design-system-vanilla
 * node --experimental-strip-types --no-warnings \
 *   --import ./src/lib/chat-eval/executar.mjs \
 *   src/lib/chat-eval/rodar.ts --config=A
 * ```
 *
 * Bandeiras:
 *
 * | bandeira | o que faz |
 * |---|---|
 * | `--config=A` | documentos INTEIROS — o comportamento de hoje, e o padrão |
 * | `--config=B` | só as seções de alto sinal (`CHAT_DOCS_CONTEXTO=recortado`) |
 * | `--locale=pt-BR` | a língua da resposta; o corpus é trilíngue |
 * | `--pausa=1200` | milissegundos entre chamadas, para não bater no limite do provedor |
 * | `--json=<arquivo>` | grava o resultado cru, para o diff A × B |
 * | `--so=<id,id>` | roda só alguns casos, pelo id |
 * | `--seco` | NÃO chama o modelo: mede só a recuperação, de graça |
 *
 * ── POR QUE ELE CHAMA A API DE VERDADE ──
 *
 * Porque o que está em jogo é o comportamento do MODELO diante de menos
 * contexto, e isso não tem simulação. Um dublê responderia o que o dublê foi
 * escrito para responder. São ~16 perguntas por rodada, centavos de chamada, e
 * é o ponto: o número tem de vir de onde a decisão vai doer.
 *
 * `--seco` existe para o outro caso — quando a mudança é só na recuperação, e
 * chamar o modelo seria gastar por nada. É o mesmo princípio de "rode o portão
 * que veria ESTE defeito".
 *
 * ── A CHAVE ──
 *
 * Este arquivo não lê, não recebe e não imprime a chave. Quem a resolve é o
 * provedor dentro de `api/perguntar.ts`, e ela nunca sai de lá — nem para o
 * log, nem para o JSON de saída, nem para uma mensagem de erro.
 */

import { menuName, recortarDocumento, responder } from '../../../../docs/shared/chat-docs/servidor';
import { loadCorpus, isLocale, type Locale } from '../../../../docs/shared/chat-docs/corpus';
import { BANCO, type CasoDeAvaliacao, type TurnoDoBanco } from './banco';
import {
  avaliarRecuperacao,
  citaSlugEsperado,
  detectarRecusa,
  negaExistencia,
  nomesInventados,
  nomesObrigatoriosFaltando,
  nomesProibidosCitados,
  nomesTraduzidosCitados,
  titulosTraduzidos,
} from './avaliador';

/* ── Argumentos ───────────────────────────────────────────────────────────── */

function bandeira(name: string): string | undefined {
  const prefixo = `--${name}=`;
  const achado = process.argv.find((arg) => arg.startsWith(prefixo));
  return achado?.slice(prefixo.length);
}

const CONFIG = (bandeira('config') ?? 'A').toUpperCase();
if (CONFIG !== 'A' && CONFIG !== 'B') {
  console.error('--config aceita A (documentos inteiros) ou B (recortado).');
  process.exit(2);
}

const LOCALE: Locale = (() => {
  const bruto = bandeira('locale') ?? 'pt-BR';
  if (!isLocale(bruto)) {
    console.error(`--locale desconhecido: ${bruto}`);
    process.exit(2);
  }
  return bruto;
})();

const PAUSA = Number(bandeira('pausa') ?? 1200);
const ARQUIVO_JSON = bandeira('json');
const SECO = process.argv.includes('--seco');
const SO = bandeira('so')?.split(',').map((id) => id.trim());

// A chave que liga o recorte. Lida pela função de servidor NA CHAMADA, e não na
// carga do módulo — é o que permite às duas configurações rodarem no mesmo
// processo sem uma contaminar a outra.
if (CONFIG === 'B') process.env.CHAT_DOCS_CONTEXTO = 'recortado';
else delete process.env.CHAT_DOCS_CONTEXTO;

/* ── Uma pergunta, ponta a ponta ──────────────────────────────────────────── */

interface Resposta {
  /** Os slugs que a recuperação escolheu, em ordem de nota. */
  fontes: { slug: string; score: number }[];
  fraca: boolean;
  text: string;
  tokensEntrada: number | null;
  tokensSaida: number | null;
  /** Milissegundos até o PRIMEIRO pedaço de texto — a latência que se sente. */
  ateOPrimeiro: number | null;
  totalMs: number;
  error: string | null;
}

/**
 * Cada chamada com um IP próprio.
 *
 * O limite de taxa da função é estado de MÓDULO, oito por minuto por IP: com um
 * IP só, a nona pergunta do banco voltaria 429 e o relatório mediria o
 * rate-limiter em vez do modelo. Mesmo truque que `api-perguntar.test.ts` usa.
 */
let contadorDeIp = 0;
function proximoIp(): string {
  contadorDeIp += 1;
  // 198.51.100.0/24 é a faixa TEST-NET-2 da RFC 5737 — reservada para
  // documentação e exemplo, nunca roteada.
  return `198.51.100.${contadorDeIp % 250}`;
}

async function perguntar(
  pergunta: string,
  historico: TurnoDoBanco[],
): Promise<Resposta> {
  const start = Date.now();
  const response: Resposta = {
    fontes: [],
    fraca: false,
    text: '',
    tokensEntrada: null,
    tokensSaida: null,
    ateOPrimeiro: null,
    totalMs: 0,
    error: null,
  };

  const http = await responder(
    new Request('http://local/api/perguntar', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': proximoIp() },
      body: JSON.stringify({ pergunta, locale: LOCALE, historico }),
    }),
  );

  if (!http.ok || !http.body) {
    const body = (await http.json()) as { code?: string };
    response.error = body.code ?? `http_${http.status}`;
    response.totalMs = Date.now() - start;
    return response;
  }

  // Lê o SSE aos poucos: é a única forma de medir o tempo até o primeiro
  // pedaço, que é a latência que a pessoa sente. Esperar o corpo inteiro
  // mediria o total duas vezes e o primeiro token nenhuma.
  const leitor = http.body.getReader();
  const decodificador = new TextDecoder();
  let restante = '';
  for (;;) {
    const { done, value } = await leitor.read();
    if (done) break;
    restante += decodificador.decode(value, { stream: true });
    const blocos = restante.split('\n\n');
    restante = blocos.pop() ?? '';
    for (const bloco of blocos) {
      const evento = /^event: (.+)$/m.exec(bloco)?.[1];
      const dado = /^data: (.+)$/m.exec(bloco)?.[1];
      if (!evento || !dado) continue;
      const carga = JSON.parse(dado) as Record<string, never>;
      if (evento === 'sources') {
        const fonte = carga as unknown as {
          weak: boolean;
          hits: { slug: string; score: number }[];
        };
        response.fontes = fonte.hits;
        response.fraca = fonte.weak;
      } else if (evento === 'delta') {
        response.ateOPrimeiro ??= Date.now() - start;
        response.text += (carga as unknown as { text: string }).text;
      } else if (evento === 'done') {
        const fim = carga as unknown as {
          usage: { input: number | null; output: number | null };
        };
        response.tokensEntrada = fim.usage.input;
        response.tokensSaida = fim.usage.output;
      } else if (evento === 'error') {
        response.error = (carga as unknown as { code: string }).code;
      }
    }
  }

  response.totalMs = Date.now() - start;
  return response;
}

/* ── O laço ───────────────────────────────────────────────────────────────── */

interface Linha {
  id: string;
  group: string;
  pergunta: string;
  fontes: string[];
  recuperacaoOk: boolean;
  firstOk: boolean | null;
  faltando: string[];
  /** A resposta trouxe marca de recusa? Informativo: nao decide sozinho. */
  recusou: boolean;
  /** Fez afirmacao sobre um dos slugs esperados, com a citacao obrigatoria? */
  respondeu: boolean;
  recusaOk: boolean;
  marcaDeRecusa: string | null;
  /** `null` quando o caso nao exige negacao de termo nenhum. */
  negouOk: boolean | null;
  fraseDaNegacao: string | null;
  traduzidos: string[];
  inventados: string[];
  obrigatoriosFaltando: string[];
  proibidosCitados: string[];
  tokensEntrada: number | null;
  tokensSaida: number | null;
  ateOPrimeiro: number | null;
  totalMs: number;
  error: string | null;
  /** Todos os critérios que se aplicam a este caso passaram. */
  ok: boolean;
  response: string;
}

const corpusOuNada = loadCorpus(LOCALE);
if (!corpusOuNada) {
  console.error('Corpus não encontrado — ver o cabeçalho de api/corpus.ts.');
  process.exit(1);
}
// Reatribuído a uma constante não-nula porque `process.exit` não estreita o
// tipo dentro das funções abaixo: para o `tsc`, elas rodam depois do `if`.
const corpus = corpusOuNada;

const catalogo = corpus.entries.map((input) => menuName(input.slug)).sort();
const traduzidos = titulosTraduzidos(corpus.entries, menuName);

function dormir(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** O texto dos documentos que foram ao prompt — usado só para isentar nomes. */
function contextoDoPrompt(slugs: readonly string[]): string {
  return slugs
    .map((slug) => {
      const bruto = corpus.documents.get(slug);
      return JSON.stringify(CONFIG === 'B' ? recortarDocumento(bruto) : bruto);
    })
    .join('\n');
}

async function rodarCaso(caso: CasoDeAvaliacao): Promise<Linha> {
  const historico: TurnoDoBanco[] = [];
  let ultima: Resposta | null = null;

  for (const pergunta of caso.perguntas) {
    if (ultima) await dormir(PAUSA);
    ultima = await perguntar(pergunta, historico);
    historico.push({ papel: 'user', texto: pergunta });
    if (ultima.text.trim()) historico.push({ papel: 'model', texto: ultima.text });
  }
  if (!ultima) throw new Error(`caso sem pergunta: ${caso.id}`);

  const slugs = ultima.fontes.map((f) => f.slug);
  const recuperacao = avaliarRecuperacao(slugs, caso.esperados, {
    exigeTodos: caso.exigeTodos,
    first: caso.first,
  });
  const recusa = detectarRecusa(ultima.text);
  const respondeu = citaSlugEsperado(ultima.text, caso.esperados);
  const negacao = caso.termoInexistente
    ? negaExistencia(ultima.text, caso.termoInexistente)
    : null;
  const row: Linha = {
    id: caso.id,
    group: caso.group,
    pergunta: caso.perguntas[caso.perguntas.length - 1],
    fontes: slugs,
    recuperacaoOk: recuperacao.ok,
    firstOk: recuperacao.firstOk,
    faltando: recuperacao.faltando,
    recusou: recusa.recusou,
    respondeu,
    // Tres regimes, e a diferenca entre eles esta em `citaSlugEsperado`:
    // - `null`  o caso e julgado pela negacao do termo, nao por aqui;
    // - `true`  negativo: tem de trazer marca de recusa;
    // - `false` positivo: tem de RESPONDER, e responder se mede pela citacao
    //           obrigatoria do slug — nao pela ausencia de marca de recusa.
    recusaOk:
      caso.deveRecusar === null
        ? true
        : caso.deveRecusar
          ? recusa.recusou
          : respondeu,
    marcaDeRecusa: recusa.marca,
    negouOk: negacao ? negacao.negou : null,
    fraseDaNegacao: negacao?.frase ?? null,
    traduzidos: nomesTraduzidosCitados(ultima.text, traduzidos),
    inventados: nomesInventados(ultima.text, catalogo, contextoDoPrompt(slugs)),
    obrigatoriosFaltando: nomesObrigatoriosFaltando(ultima.text, caso.nomesObrigatorios),
    proibidosCitados: nomesProibidosCitados(ultima.text, caso.nomesProibidos),
    tokensEntrada: ultima.tokensEntrada,
    tokensSaida: ultima.tokensSaida,
    ateOPrimeiro: ultima.ateOPrimeiro,
    totalMs: ultima.totalMs,
    error: ultima.error,
    ok: false,
    response: ultima.text,
  };

  row.ok =
    row.error === null &&
    row.recuperacaoOk &&
    row.firstOk !== false &&
    row.recusaOk &&
    row.negouOk !== false &&
    row.traduzidos.length === 0 &&
    row.inventados.length === 0 &&
    row.obrigatoriosFaltando.length === 0 &&
    row.proibidosCitados.length === 0;

  return row;
}

/**
 * Só a recuperação — o modo `--seco`, que não gasta chamada nenhuma.
 *
 * O acerto de recuperação é o único critério do banco que não precisa de
 * modelo, e é justamente o que muda quando alguém mexe em `docs-index.ts`. Ter
 * esse pedaço de graça é o que evita rodar 32 chamadas para conferir uma
 * mudança de pontuação.
 *
 * A consulta é montada aqui, com a pergunta anterior concatenada, porque é o
 * que `consultaDeRecuperacao` faz no servidor. Se aquela regra mudar, esta
 * linha muda junto — está anotado de propósito, porque duplicação silenciosa
 * entre avaliador e código medido é como um banco começa a medir outra coisa.
 */
async function rodarCasoSeco(caso: CasoDeAvaliacao): Promise<Linha> {
  const { searchDocs } = await import('../../../../docs/shared/primitives/docs-index');
  const previous = caso.perguntas.length > 1 ? caso.perguntas[caso.perguntas.length - 2] : null;
  const atual = caso.perguntas[caso.perguntas.length - 1];
  const consulta = previous ? `${previous} ${atual}` : atual;
  const hits = searchDocs(corpus.entries, consulta, { limit: 5 });
  const slugs = hits.map((h) => h.slug);
  const recuperacao = avaliarRecuperacao(slugs, caso.esperados, {
    exigeTodos: caso.exigeTodos,
    first: caso.first,
  });
  return {
    id: caso.id,
    group: caso.group,
    pergunta: atual,
    fontes: hits.map((h) => `${h.slug}:${h.score.toFixed(2)}`),
    recuperacaoOk: recuperacao.ok,
    firstOk: recuperacao.firstOk,
    faltando: recuperacao.faltando,
    recusou: false,
    respondeu: false,
    recusaOk: true,
    marcaDeRecusa: null,
    negouOk: null,
    fraseDaNegacao: null,
    traduzidos: [],
    inventados: [],
    obrigatoriosFaltando: [],
    proibidosCitados: [],
    tokensEntrada: null,
    tokensSaida: null,
    ateOPrimeiro: null,
    totalMs: 0,
    error: null,
    ok: recuperacao.ok && recuperacao.firstOk !== false,
    response: '',
  };
}

/* ── Saída ────────────────────────────────────────────────────────────────── */

function pad(text: string, largura: number): string {
  return text.length >= largura ? text.slice(0, largura) : text.padEnd(largura);
}

function marca(ok: boolean | null): string {
  if (ok === null) return ' - ';
  return ok ? ' ok' : 'FAIL';
}

function mediana(valores: number[]): number {
  if (valores.length === 0) return 0;
  const ordenados = [...valores].sort((a, b) => a - b);
  const meio = Math.floor(ordenados.length / 2);
  return ordenados.length % 2 ? ordenados[meio] : (ordenados[meio - 1] + ordenados[meio]) / 2;
}

function imprimir(linhas: Linha[]): void {
  console.log('');
  console.log(
    [
      pad('caso', 26),
      pad('recup', 6),
      pad('1o', 5),
      pad('recusa', 7),
      pad('nega', 5),
      pad('nomes', 6),
      pad('entrada', 8),
      pad('saida', 6),
      pad('1o tok', 7),
      pad('total', 7),
    ].join(' '),
  );
  console.log('-'.repeat(86));
  for (const l of linhas) {
    const nomesOk =
      l.traduzidos.length === 0 &&
      l.inventados.length === 0 &&
      l.obrigatoriosFaltando.length === 0 &&
      l.proibidosCitados.length === 0;
    console.log(
      [
        pad((l.ok ? '  ' : '! ') + l.id, 26),
        pad(marca(l.recuperacaoOk), 6),
        pad(marca(l.firstOk), 5),
        pad(marca(l.recusaOk), 7),
        pad(marca(l.negouOk), 5),
        pad(marca(nomesOk), 6),
        pad(l.tokensEntrada === null ? '—' : String(l.tokensEntrada), 8),
        pad(l.tokensSaida === null ? '—' : String(l.tokensSaida), 6),
        pad(l.ateOPrimeiro === null ? '—' : `${l.ateOPrimeiro}ms`, 7),
        pad(`${l.totalMs}ms`, 7),
      ].join(' '),
    );
    // O detalhe só aparece quando reprova: tabela que sempre explica não se lê.
    if (l.error) console.log(`     erro: ${l.error}`);
    if (!l.recuperacaoOk) console.log(`     faltou recuperar: ${l.faltando.join(', ')}`);
    if (l.firstOk === false) console.log(`     primeiro veio: ${l.fontes[0] ?? '—'}`);
    if (!l.recusaOk) {
      console.log(
        l.respondeu
          ? '     respondeu quando devia dizer que não sabe'
          : `     não afirmou nada sobre o slug esperado (marca de recusa: "${l.marcaDeRecusa}")`,
      );
    }
    if (l.recusaOk && l.recusou && l.respondeu) {
      console.log(`     (corrigiu antes de responder — marca "${l.marcaDeRecusa}", não é recusa)`);
    }
    if (l.negouOk === false) {
      console.log('     não negou o termo que não existe — resposta plausível e errada');
    }
    if (l.traduzidos.length) console.log(`     nome traduzido: ${l.traduzidos.join(', ')}`);
    if (l.inventados.length) console.log(`     nome inventado: ${l.inventados.join(', ')}`);
    if (l.obrigatoriosFaltando.length) {
      console.log(`     não citou: ${l.obrigatoriosFaltando.join(', ')}`);
    }
    if (l.proibidosCitados.length) {
      console.log(`     citou proibido: ${l.proibidosCitados.join(', ')}`);
    }
  }
}

function resumir(linhas: Linha[]): void {
  const total = linhas.length;
  const conta = (p: (l: Linha) => boolean) => linhas.filter(p).length;
  const entradas = linhas.map((l) => l.tokensEntrada).filter((v): v is number => v !== null);
  const saidas = linhas.map((l) => l.tokensSaida).filter((v): v is number => v !== null);
  const primeiros = linhas.map((l) => l.ateOPrimeiro).filter((v): v is number => v !== null);
  const totais = linhas.map((l) => l.totalMs).filter((v) => v > 0);
  const soma = (v: number[]) => v.reduce((a, b) => a + b, 0);

  console.log('');
  console.log(`── resumo · configuração ${CONFIG} · ${LOCALE} ──`);
  console.log(`casos totalmente verdes      ${conta((l) => l.ok)}/${total}`);
  console.log(`acerto de recuperação        ${conta((l) => l.recuperacaoOk)}/${total}`);
  console.log(
    `primeiro colocado certo      ${conta((l) => l.firstOk === true)}/${conta((l) => l.firstOk !== null)}`,
  );
  console.log(`recusa no lugar certo        ${conta((l) => l.recusaOk)}/${total}`);
  const comNegacao = conta((l) => l.negouOk !== null);
  if (comNegacao) {
    console.log(`negou a prop inexistente     ${conta((l) => l.negouOk === true)}/${comNegacao}`);
  }
  console.log(`sem nome traduzido           ${conta((l) => l.traduzidos.length === 0)}/${total}`);
  console.log(`sem nome inventado           ${conta((l) => l.inventados.length === 0)}/${total}`);
  console.log(
    `nomes obrigatórios citados   ${conta((l) => l.obrigatoriosFaltando.length === 0)}/${total}`,
  );
  console.log(`erros de provedor            ${conta((l) => l.error !== null)}/${total}`);
  if (entradas.length) {
    console.log('');
    console.log(
      `tokens de entrada            total ${soma(entradas)} · mediana ${mediana(entradas)} · máx ${Math.max(...entradas)}`,
    );
    console.log(
      `tokens de saída              total ${soma(saidas)} · mediana ${mediana(saidas)} · máx ${Math.max(...saidas)}`,
    );
    console.log(`tempo até o 1º pedaço        mediana ${mediana(primeiros)}ms`);
    console.log(`tempo total por pergunta     mediana ${mediana(totais)}ms`);
  }
}

/* ── Principal ────────────────────────────────────────────────────────────── */

const casos = BANCO.filter((caso) => !SO || SO.includes(caso.id));

const linhas: Linha[] = [];
for (const caso of casos) {
  const row = SECO ? await rodarCasoSeco(caso) : await rodarCaso(caso);
  linhas.push(row);
  if (!SECO) await dormir(PAUSA);
}

imprimir(linhas);
resumir(linhas);

if (ARQUIVO_JSON) {
  const { writeFileSync } = await import('node:fs');
  writeFileSync(
    ARQUIVO_JSON,
    JSON.stringify({ config: CONFIG, locale: LOCALE, linhas }, null, 2),
    'utf8',
  );
  console.log(`\nresultado cru em ${ARQUIVO_JSON}`);
}

// Código de saída: verde é zero. É o que permite pendurar isto num portão o dia
// em que a dona quiser — hoje ele é instrumento, não portão.
process.exit(linhas.every((l) => l.ok) ? 0 : 1);
