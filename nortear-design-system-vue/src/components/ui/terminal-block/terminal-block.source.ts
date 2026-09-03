/**
 * Transforms do painel Code do bloco de terminal.
 *
 * Módulo de TS puro, sem import de `.vue`: é o que deixa as funções rodarem no
 * projeto `unit` do vitest, a única guarda que elas têm — a saída do painel não
 * chega ao DOM durante a `play`.
 *
 * Cada configuração tem a SUA função exportada, chamável SEM argumento. Fábrica
 * curried devolveria função em vez de string, e as checagens que leem o snippet
 * nunca chegariam ao snippet.
 *
 * AS LINHAS ENTRAM POR EXTENSO em quase todos, e é decisão. O assunto desta
 * peça é o que acontece com a saída — a coluna que só fecha com avanço fixo, a
 * linha mais larga que o bloco, o comando que não escreveu nada —, e um snippet
 * que mostrasse `:lines="saida"` esconderia justamente o que a story fotografa.
 * Onde a lista é longa demais para o painel, o snippet nomeia a constante e diz
 * o que ela tem.
 */
import { indentar, text, vueSnippet, type SourceTransform } from '@/lib/story-source';

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

// O caminho é o do ÍNDICE da peça, e não o do arquivo interno: é assim que os
// componentes desta stack entram, e um snippet que ensinasse o atalho direto
// ensinaria a furar a única porta que a peça tem.
const IMPORT = "import { TerminalBlock } from '@/components/ui/terminal-block';";

const IMPORT_STATUSES = [
  IMPORT,
  "import { RUN_STATUSES } from '@shared/primitives/chat-protocol';",
].join('\n');

const IMPORT_BESIDE = [
  IMPORT,
  "import { AgentStatus } from '@/components/ui/agent-status';",
].join('\n');

const COMMAND = 'npm run build --workspace @nortear/ds';

/** Uma linha de saída como literal de string, dentro do atributo. */
function lineLiteral(line: string): string {
  return `'${text(line).replace(/'/g, "\\'")}'`;
}

/**
 * `:lines="[…]"` com uma linha por item, ou nada quando não há linha nenhuma.
 *
 * O recuo interno já sai pronto: o atributo inteiro é indentado uma vez pela
 * montagem da tag, e as entradas ficam um degrau adentro dele.
 */
function linesAttr(opts: TerminalBlockSnippetOptions): string | undefined {
  if (opts.linesRef) return `:lines="${opts.linesRef}"`;
  if (!opts.lines || opts.lines.length === 0) return undefined;
  return [':lines="[', ...opts.lines.map((line) => `  ${lineLiteral(line)},`), ']"'].join('\n');
}

/**
 * A tag da peça, sempre com um atributo por linha.
 *
 * Ela não tem evento nenhum, e é a única da família assim: sem ação oferecida
 * não há aviso a escutar, então o snippet é só o que a peça recebe.
 */
function terminalTag(opts: TerminalBlockSnippetOptions): string {
  const attributes = [
    `command="${text(COMMAND)}"`,
    linesAttr(opts),
    `status="${text(opts.status, 'running')}"`,
    // O número só existe depois do fim, e o snippet acompanha: ensinar a
    // mandá-lo com a execução em curso ensinaria a mandar um resultado que
    // ainda não aconteceu.
    opts.exitCode === undefined ? undefined : `:exit-code="${opts.exitCode}"`,
    ':labels="rotulos"',
  ].filter((part): part is string => Boolean(part));

  return `<TerminalBlock\n${attributes.map((part) => indentar(part)).join('\n')}\n/>`;
}

function build(opts: TerminalBlockSnippetOptions): string {
  return vueSnippet(IMPORT, terminalTag(opts));
}

/** Transform do `meta` — o Playground, que escreve os eixos por extenso. */
export const terminalBlockSource: SourceTransform<{
  status: string;
  exitCode: number;
  withOutput: boolean;
}> = (_generated, ctx) => {
  const args = ctx?.args ?? {};
  return build({
    status: args.status,
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
  return vueSnippet(
    IMPORT_STATUSES,
    [
      '<TerminalBlock',
      '  v-for="status in RUN_STATUSES"',
      '  :key="status"',
      `  command="${text(COMMAND)}"`,
      '  :lines="saidaDe(status)"',
      '  :status="status"',
      '  :exit-code="codigoDe(status)"',
      '  :labels="rotulos"',
      '/>',
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
      'src/components/ui/terminal-block/TerminalBlock.vue:142:18 - error TS2554: Expected 2 arguments, but got 1. The second argument is required because the component reads the labels from it.',
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
 * Cada peça é AUTÔNOMA, e por isso o snippet repete a tag por comando em vez de
 * passar uma lista para dentro de um contêiner: quem tem a sequência é quem
 * consome, e uma peça que a recebesse decidiria ordenação e agrupamento, que
 * são do produto.
 */
export function terminalBlockSequenceSource(): string {
  return vueSnippet(
    [
      IMPORT,
      '',
      '// A sequência é de quem consome, e por isso ela é DECLARADA aqui: um',
      '// laço sobre um nome que o snippet não declara não resolve na mão de',
      '// quem copia.',
      'const sequencia = [',
      `  { id: 'build', command: '${COMMAND}', lines: ['built in 8.42s'], status: 'complete', exitCode: 0 },`,
      "  { id: 'test', command: 'npm test --workspace @nortear/ds', lines: ['ERROR: build failed with 1 error'], status: 'failed', exitCode: 1 },",
      '  // O que ainda não correu não escreveu nada, e não tem código de saída.',
      "  { id: 'publish', command: 'npm publish --workspace @nortear/ds', status: 'idle' },",
      '];',
    ].join('\n'),
    [
      '<TerminalBlock',
      '  v-for="passo in sequencia"',
      '  :key="passo.id"',
      '  :command="passo.command"',
      '  :lines="passo.lines"',
      '  :status="passo.status"',
      '  :exit-code="passo.exitCode"',
      '  :labels="rotulos"',
      '/>',
    ].join('\n'),
  );
}

/**
 * A peça abaixo da linha de estado da execução.
 *
 * Elas são AUTÔNOMAS e respondem a perguntas diferentes: uma diz em que pé
 * está a resposta inteira e carrega as ações de parar e repetir, a outra
 * mostra o que um comando dentro dela escreveu. Por isso o snippet monta as
 * duas como irmãs, e não passa uma para dentro da outra.
 */
export function terminalBlockBesideRunSource(): string {
  const body = [
    '<AgentStatus status="running" elapsed="0:42" :labels="rotulosDaExecucao" />',
    terminalTag({ status: 'running', linesRef: 'saida' }),
  ].join('\n');

  return vueSnippet(
    IMPORT_BESIDE,
    `<div class="nds-stack nds-max-w-lg" data-spacing="lg">\n${indentar(body)}\n</div>`,
  );
}

/**
 * A saída longa, que rola dentro do próprio bloco.
 *
 * O teto entra no snippet como custom property numa folha, e não como altura em
 * `style`: é a única maneira de mudá-lo sem tirar o valor do tema e da escala
 * de tipo — e ele é em `rem` para crescer com a fonte do navegador em vez de
 * espremer mais linhas no mesmo espaço.
 */
export function terminalBlockLongOutputSource(): string {
  const stylesheet = [
    '<style>',
    '/* O teto da caixa que rola, na folha de quem consome. */',
    '.nds-terminal-block {',
    '  --terminal-block-max-block-size: 12rem;',
    '}',
    '</' + 'style>',
  ].join('\n');

  return [
    build({ status: 'complete', exitCode: 0, linesRef: 'saidaLonga' }),
    stylesheet,
  ].join('\n\n');
}
