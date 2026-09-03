/**
 * Snippet do painel Code do bloco de terminal — ver `@/lib/story-source`.
 *
 * Módulo de TS puro — nada de `.tsx` em valor. É o que deixa as funções rodarem
 * no projeto `unit` do vitest, a única guarda que elas têm: a saída do painel
 * não chega ao DOM durante a `play`.
 *
 * Cada configuração tem a SUA função exportada, chamável SEM argumento. Fábrica
 * curried devolveria função em vez de string, e as checagens que leem o snippet
 * nunca chegariam ao snippet.
 *
 * AS LINHAS ENTRAM POR EXTENSO em quase todos, e é decisão. O assunto desta
 * peça é o que acontece com a saída — a coluna que só fecha com avanço fixo, a
 * linha mais larga que o bloco, o comando que não escreveu nada —, e um snippet
 * que mostrasse `lines={saida}` esconderia justamente o que a story fotografa.
 * Onde a lista é longa demais para o painel, o snippet nomeia a constante e diz
 * o que ela tem.
 */
import { indentar, jsxSnippet, text, type SourceTransform } from '@/lib/story-source';

const IMPORT = 'import { TerminalBlock } from "@/components/ui/terminal-block";';

const COMMAND = 'npm run build --workspace @nortear/ds';

export type TerminalBlockSnippetOptions = {
  /** Em que pé está o comando. */
  status?: string;
  /** As linhas da saída, por extenso. Vazio é "não escreveu nada". */
  lines?: readonly string[];
  /** O que o processo devolveu. Só existe depois do fim. */
  exitCode?: number;
  /** O nome de uma constante, quando a lista é longa demais para o painel. */
  linesRef?: string;
};

/**
 * Os rótulos, por INTEIRO.
 *
 * Não cabe resumir: `labels` é obrigatória e a palavra de cada estado é um
 * `Record` completo — um objeto pela metade não compila para quem copia, e é
 * essa palavra que descreve o estado no lugar do ponto colorido ao lado. O
 * `exitCode` é MOLDE, e não texto pronto: a palavra que apresenta o número é
 * do idioma, e o número é dado.
 */
const LABELS_BLOCK = [
  'const rotulos = {',
  '  status: {',
  '    idle: "Em espera",',
  '    running: "Em andamento",',
  '    stopped: "Interrompido",',
  '    complete: "Concluído",',
  '    failed: "Falhou",',
  '  },',
  '  exitCode: "código de saída {code}",',
  '};',
].join('\n');

/**
 * Os rótulos da LINHA DE ESTADO da execução, por inteiro e pelo mesmo motivo.
 *
 * Só entram no snippet que mostra as duas peças empilhadas. `action` fica de
 * fora em espera e concluída de propósito: começar uma execução é do campo de
 * mensagem, e sobre uma resposta pronta não há o que fazer ali.
 */
const RUN_LABELS_BLOCK = [
  'const rotulosDaExecucao = {',
  '  status: {',
  '    idle: "Em espera",',
  '    running: "Respondendo",',
  '    stopped: "Interrompida",',
  '    complete: "Concluída",',
  '    failed: "Falhou",',
  '  },',
  '  action: { running: "Parar", stopped: "Retomar", failed: "Tentar de novo" },',
  '};',
].join('\n');

/**
 * A saída do exemplo, RESUMIDA a duas linhas.
 *
 * Resumida, e não elidida: a versão anterior citava `saida` sem nunca
 * declará-la, e quem copiasse recebia um símbolo indefinido. Duas linhas
 * bastam porque neste ramo o assunto não é o que a saída diz — é onde ela
 * entra.
 */
const OUTPUT_BLOCK = [
  '// O que o comando escreveu — aqui, as duas primeiras linhas.',
  'const saida = [',
  '  "vite v7.1.0 building for production...",',
  '  "transforming (412) src/main.ts",',
  '];',
].join('\n');

/**
 * A saída LONGA, resumida a três das trinta.
 *
 * O assunto daquele ramo é a caixa que rola, e não o texto: o que a story
 * mostra é uma lista mais alta que o teto, e três linhas com a nota de que há
 * mais ensinam isso sem afogar o painel.
 */
const LONG_OUTPUT_BLOCK = [
  '// Uma saída mais alta que o teto da caixa — aqui, as três primeiras de trinta.',
  'const saidaLonga = [',
  '  "vite v7.1.0 building for production...",',
  '  "transforming (412) src/main.ts",',
  '  "transforming (908) src/components/ui/terminal-block.ts",',
  '];',
].join('\n');

/**
 * A saída e o código de cada estado, para o ramo que percorre o vocabulário.
 *
 * As duas saem de um MAPA, e não de um `if` escrito à mão: estado novo no
 * vocabulário compartilhado aparece aqui como chave faltando, e não como caso
 * esquecido. Em espera não escreveu nada, e em espera e em andamento não há
 * código de saída — o número só existe depois do fim.
 */
const STATUS_FUNCTIONS_BLOCK = [
  'const saidaPorEstado = {',
  '  idle: [],',
  '  running: ["transforming (412) src/main.ts"],',
  '  stopped: ["transforming (612) src/components/ui/chat-thread.ts", "^C"],',
  '  complete: ["built in 8.42s"],',
  '  failed: ["ERROR: build failed with 1 error"],',
  '};',
  'const saidaDe = (status) => saidaPorEstado[status];',
  '',
  '// Cento e trinta é o que um processo devolve quando o sinal de interrupção o',
  '// alcança: não é zero, e ainda assim ninguém falhou.',
  'const codigoPorEstado = { stopped: 130, complete: 0, failed: 1 };',
  'const codigoDe = (status) => codigoPorEstado[status];',
].join('\n');

/** O que cada ramo precisa ter declarado antes da chamada. */
type TerminalPreambleOptions = {
  /** O nome da constante com a saída, quando ela não entra por extenso. */
  linesRef?: string;
  /** O ramo percorre os cinco estados, e precisa das duas funções? */
  statusFunctions?: boolean;
  /** O ramo mostra a linha de estado da execução junto? */
  agentStatus?: boolean;
};

/** O preâmbulo: os imports e tudo que a chamada daquele ramo referencia. */
function preamble(imports: string, opts: TerminalPreambleOptions = {}): string {
  const partes = [imports, LABELS_BLOCK];
  if (opts.agentStatus) partes.push(RUN_LABELS_BLOCK);
  if (opts.linesRef === 'saida') partes.push(OUTPUT_BLOCK);
  if (opts.linesRef === 'saidaLonga') partes.push(LONG_OUTPUT_BLOCK);
  if (opts.statusFunctions) partes.push(STATUS_FUNCTIONS_BLOCK);
  return partes.join('\n\n');
}

/** `{[\n  "linha",\n]}`, ou nada quando não há linha nenhuma. */
function linesLiteral(lines: readonly string[]): string {
  return ['{[', ...lines.map((line) => `  ${JSON.stringify(line)},`), ']}'].join('\n');
}

/**
 * A tag, sempre com um atributo por linha.
 *
 * `attrsMultilinha` indentaria só a PRIMEIRA linha de cada atributo, e o
 * literal das linhas tem várias — a lista sairia torta justamente no atributo
 * que é o assunto da peça.
 */
function tag(parts: Array<string | undefined>): string {
  const list = parts.filter((part): part is string => Boolean(part));
  return `<TerminalBlock\n${list.map((part) => indentar(part)).join('\n')}\n/>`;
}

function build(opts: TerminalBlockSnippetOptions): string {
  const lines =
    opts.linesRef !== undefined
      ? `lines={${opts.linesRef}}`
      : opts.lines && opts.lines.length > 0
        ? `lines=${linesLiteral(opts.lines)}`
        : undefined;

  return jsxSnippet(
    preamble(IMPORT, { linesRef: opts.linesRef }),
    tag([
      `command="${COMMAND}"`,
      lines,
      `status="${opts.status ?? 'running'}"`,
      // O número só existe depois do fim, e o snippet acompanha: ensinar a
      // mandá-lo com a execução em curso ensinaria a mandar um resultado que
      // ainda não aconteceu.
      opts.exitCode === undefined ? undefined : `exitCode={${opts.exitCode}}`,
      'labels={rotulos}',
    ]),
  );
}

/** Transform do `meta` — o Playground, que escreve os eixos por extenso. */
export const terminalBlockSource: SourceTransform<{
  status: string;
  exitCode: number;
  withOutput: boolean;
}> = (_generated, ctx) => {
  const args = ctx?.args ?? {};
  return build({
    status: text(args.status),
    linesRef: args.withOutput === false ? undefined : 'saida',
    // O controle numérico vazio é ausência de código de saída, e não zero: zero
    // é um resultado, e ausência é não haver resultado ainda.
    exitCode: Number.isFinite(args.exitCode) ? args.exitCode : undefined,
  });
};

/**
 * Os cinco estados, percorrendo o vocabulário compartilhado.
 *
 * O snippet ensina a ITERAR `RUN_STATUSES` em vez de escrever a lista à mão,
 * que é o mesmo motivo de a constante existir: lista escrita à mão fica para
 * trás no dia em que o tipo cresce, e ninguém repara.
 */
export function terminalBlockEveryStatusSource(): string {
  return jsxSnippet(
    preamble(
      [IMPORT, 'import { RUN_STATUSES } from "@shared/primitives/chat-protocol";'].join('\n'),
      { statusFunctions: true },
    ),
    [
      'RUN_STATUSES.map((status) => (',
      '  <TerminalBlock',
      '    key={status}',
      `    command="${COMMAND}"`,
      '    lines={saidaDe(status)}',
      '    status={status}',
      '    exitCode={codigoDe(status)}',
      '    labels={rotulos}',
      '  />',
      '))',
    ].join('\n'),
  );
}

/** Enquanto a saída chega: a peça se declara ocupada e o cursor aparece. */
export function terminalBlockRunningSource(): string {
  return build({
    status: 'running',
    lines: ['vite v7.1.0 building for production...', 'transforming (412) src/main.ts'],
  });
}

/**
 * Concluído, com a tabela alinhada.
 *
 * As três colunas entram por extenso porque são o assunto: elas só ficam
 * alinhadas com avanço fixo e com o espaçamento preservado, e um snippet que
 * as escondesse atrás de uma constante esconderia a razão da story.
 */
export function terminalBlockCompleteSource(): string {
  return build({
    status: 'complete',
    exitCode: 0,
    lines: [
      'dist/index.html                    0.71 kB   gzip:   0.40 kB',
      'dist/assets/index-Bq4Xk2wR.css   142.08 kB   gzip:  19.63 kB',
      'dist/assets/index-D8mZp1Lt.js    486.24 kB   gzip: 152.11 kB',
    ],
  });
}

/**
 * Falhou, com uma linha mais larga que o bloco.
 *
 * A linha longa entra por extenso pelo mesmo motivo: é ela que rola na
 * horizontal dentro do próprio bloco, e sem vê-la o snippet não ensina o caso.
 */
export function terminalBlockFailedSource(): string {
  return build({
    status: 'failed',
    exitCode: 1,
    lines: [
      'src/components/ui/terminal-block.ts:142:18 - error TS2554: Expected 2 arguments, but got 1. The second argument is required because the factory reads the labels from it.',
      'ERROR: build failed with 1 error',
    ],
  });
}

/**
 * Interrompido, e o código de saída que prova que a peça não o interpreta.
 *
 * Cento e trinta é o que um processo devolve quando o sinal de interrupção o
 * alcança. Não é zero, e ainda assim ninguém falhou — quem diz o que aconteceu
 * é o estado.
 */
export function terminalBlockStoppedSource(): string {
  return build({
    status: 'stopped',
    exitCode: 130,
    lines: ['transforming (612) src/components/ui/chat-thread.ts', '^C'],
  });
}

/**
 * O comando que terminou sem escrever nada.
 *
 * A ausência da lista é o assunto: sem linha nenhuma não há caixa de saída, e
 * uma caixa vazia com parada de tabulação dentro seria dar foco a lugar nenhum.
 */
export function terminalBlockWithoutOutputSource(): string {
  return build({ status: 'complete', exitCode: 0 });
}

/**
 * A sequência de comandos.
 *
 * Cada peça é AUTÔNOMA, e por isso o snippet monta uma por comando em vez de
 * passar uma lista para dentro de um contêiner: quem tem a sequência é quem
 * consome, e uma peça que a recebesse decidiria ordenação e agrupamento, que
 * são do produto.
 */
export function terminalBlockSequenceSource(): string {
  return jsxSnippet(
    preamble(IMPORT),
    [
      '// A sequência é de quem consome, e por isso ela é DECLARADA aqui: um',
      '// laço sobre um nome que o snippet não declara não compila na mão de quem',
      '// copia.',
      'const sequencia = [',
      `  { id: "build", command: "${COMMAND}", lines: ["built in 8.42s"], status: "complete", exitCode: 0 },`,
      '  { id: "test", command: "npm test --workspace @nortear/ds", lines: ["ERROR: build failed with 1 error"], status: "failed", exitCode: 1 },',
      '  // O que ainda não correu não escreveu nada, e não tem código de saída.',
      '  { id: "publish", command: "npm publish --workspace @nortear/ds", status: "idle" },',
      '];',
      '',
      'sequencia.map((passo) => (',
      '  <TerminalBlock',
      '    key={passo.id}',
      '    command={passo.command}',
      '    lines={passo.lines}',
      '    status={passo.status}',
      '    exitCode={passo.exitCode}',
      '    labels={rotulos}',
      '  />',
      '))',
    ].join('\n'),
  );
}

/**
 * A peça abaixo da linha de estado da execução.
 *
 * Elas são AUTÔNOMAS e respondem a perguntas diferentes: uma diz em que pé
 * está a resposta inteira e carrega as ações de parar e repetir, a outra
 * mostra o que um comando dentro dela escreveu. Por isso o snippet monta as
 * duas em sequência, e não passa uma para dentro da outra.
 */
export function terminalBlockBesideRunSource(): string {
  return jsxSnippet(
    preamble([IMPORT, 'import { AgentStatus } from "@/components/ui/agent-status";'].join('\n'), {
      linesRef: 'saida',
      agentStatus: true,
    }),
    [
      '<div className="nds-stack" data-spacing="lg">',
      '  <AgentStatus status="running" elapsed="0:42" labels={rotulosDaExecucao} />',
      indentar(
        tag([
          `command="${COMMAND}"`,
          'lines={saida}',
          'status="running"',
          'labels={rotulos}',
        ]),
      ),
      '</div>',
    ].join('\n'),
  );
}

/**
 * A saída longa, que rola dentro do próprio bloco.
 *
 * O teto entra no snippet como custom property, e não como altura em `style`:
 * é a única maneira de mudá-lo sem tirar o valor do tema e da escala de tipo —
 * e ele é em `rem` para crescer com a fonte do navegador em vez de espremer
 * mais linhas no mesmo espaço.
 */
export function terminalBlockLongOutputSource(): string {
  return jsxSnippet(
    preamble(IMPORT, { linesRef: 'saidaLonga' }),
    [
      tag([
        `command="${COMMAND}"`,
        'lines={saidaLonga}',
        'status="complete"',
        'exitCode={0}',
        'labels={rotulos}',
      ]),
      '',
      '/* O teto da caixa que rola, na folha de quem consome. */',
      '.nds-terminal-block {',
      '  --terminal-block-max-block-size: 12rem;',
      '}',
    ].join('\n'),
  );
}
