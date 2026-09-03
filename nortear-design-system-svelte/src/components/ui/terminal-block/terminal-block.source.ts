/**
 * Transforms do painel Code do bloco de terminal.
 *
 * Módulo de TS puro, sem import de `.svelte`: é o que deixa as funções rodarem
 * no projeto `unit` do vitest, a única guarda que elas têm — a saída do painel
 * não chega ao DOM durante a `play`.
 *
 * Existem porque nesta stack o docgen está DESLIGADO: sem transform, o gerador
 * monta a tag a partir do nome interno da função compilada e publica
 * `<wrapper …/>`, que não é um componente que alguém possa importar.
 *
 * Cada configuração tem a SUA função exportada, chamável SEM argumento. Fábrica
 * curried devolveria função em vez de string, e as checagens que leem o snippet
 * nunca chegariam ao snippet.
 *
 * AS LINHAS ENTRAM POR EXTENSO em quase todos, e é decisão. O assunto desta peça
 * é o que acontece com a saída — a coluna que só fecha com avanço fixo, a linha
 * mais larga que o bloco, o comando que não escreveu nada —, e um snippet que
 * mostrasse `lines={saida}` esconderia justamente o que a story fotografa. Onde
 * a lista é longa demais para o painel, o snippet nomeia a constante.
 */
import { attrsMultilinha, svelteSnippet } from '@/lib/story-source';

/** O que as stories mudam e que o snippet precisa mostrar. */
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

/** O contexto que o painel Code entrega à transform. */
type StoryContext = { args?: { status?: string; exitCode?: number; withOutput?: boolean } };

const IMPORT = "import { TerminalBlock } from '@/components/ui/terminal-block';";
const IMPORT_RUN = "import { AgentStatus } from '@/components/ui/agent-status';";
const IMPORT_STATUSES = "import { RUN_STATUSES } from '@shared/primitives/chat-protocol';";

const COMMAND = 'npm run build --workspace @nortear/ds';
const LABELS = 'labels={rotulos}';

/**
 * O `<script>` do exemplo, com o que a marcação LIGA.
 *
 * NOME LIGADO É NOME DECLARADO. A saída longa continua entrando por NOME — é o
 * que o comentário do topo defende —, mas o nome passa a existir no bloco que
 * alguém copia.
 */
function script(imports: string[], ...extras: string[]): string {
  return [
    ...imports,
    '',
    '// Os rótulos são texto de interface, e vêm de quem consome.',
    'const rotulos = { /* os rótulos do bloco */ };',
    ...extras,
  ].join('\n');
}

/** A saída guardada num nome, quando ela é longa demais para o painel. */
function declSaida(nome: string): string {
  return [
    '',
    '// A saída é do processo, e chega linha a linha para quem a mostra.',
    `const ${nome} = [/* as linhas que o comando escreveu */];`,
  ].join('\n');
}

/** As duas funções que a sequência de estados consulta. */
const DECL_POR_ESTADO = [
  '',
  '// A saída e o número de cada estado são de quem rodou o comando: a peça só',
  '// mostra o que recebe.',
  'function saidaDe(status) { /* as linhas daquele estado */ }',
  'function codigoDe(status) { /* o número daquele estado, ou nada */ }',
].join('\n');

/** Literal de cadeia com aspas simples, escapando o que quebraria a string. */
function text(value: string): string {
  return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

/**
 * `lines={[…]}` por extenso, o nome de uma constante, ou nada.
 *
 * A indentação interna é escrita aqui porque `attrsMultilinha` só prefixa a
 * PRIMEIRA linha de cada atributo — o resto do literal tem de chegar já alinhado.
 */
function linesAttribute(opts: TerminalBlockSnippetOptions): string | false {
  if (opts.linesRef) return `lines={${opts.linesRef}}`;
  if (!opts.lines || opts.lines.length === 0) return false;
  return ['lines={[', ...opts.lines.map((line) => `    ${text(line)},`), '  ]}'].join('\n');
}

/** O uso real: o comando, as linhas, o estado, o número e os rótulos. */
function build(opts: TerminalBlockSnippetOptions): string {
  const attributes = attrsMultilinha([
    `command=${text(COMMAND)}`,
    linesAttribute(opts),
    `status="${opts.status ?? 'running'}"`,
    // O número só existe depois do fim, e o snippet acompanha: ensinar a
    // mandá-lo com a execução em curso ensinaria a mandar um resultado que ainda
    // não aconteceu.
    opts.exitCode === undefined ? false : `exitCode={${opts.exitCode}}`,
    LABELS,
  ]);

  return svelteSnippet(
    script([IMPORT], ...(opts.linesRef ? [declSaida(opts.linesRef)] : [])),
    `<TerminalBlock${attributes} />`,
  );
}

/** Transform do `meta` — o Playground, que escreve os eixos por extenso. */
export function terminalBlockSource(_generated?: unknown, ctx?: StoryContext): string {
  const args = ctx?.args ?? {};
  return build({
    status: args.status,
    linesRef: args.withOutput === false ? undefined : 'saida',
    // O controle numérico vazio é ausência de código de saída, e não zero: zero
    // é um resultado, e ausência é não haver resultado ainda.
    exitCode: Number.isFinite(args.exitCode) ? args.exitCode : undefined,
  });
}

/**
 * Os cinco estados, percorrendo o vocabulário compartilhado.
 *
 * O snippet ensina a ITERAR `RUN_STATUSES` em vez de escrever a lista à mão, que
 * é o mesmo motivo de a constante existir: lista escrita à mão fica para trás no
 * dia em que o tipo cresce, e ninguém repara.
 */
export function terminalBlockEveryStatusSource(): string {
  const markup = [
    '<div class="nds-stack" data-spacing="lg">',
    '  {#each RUN_STATUSES as status (status)}',
    '    <TerminalBlock',
    `      command=${text(COMMAND)}`,
    '      lines={saidaDe(status)}',
    '      {status}',
    '      exitCode={codigoDe(status)}',
    `      ${LABELS}`,
    '    />',
    '  {/each}',
    '</div>',
  ].join('\n');

  return svelteSnippet(script([IMPORT, IMPORT_STATUSES], DECL_POR_ESTADO), markup);
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
 * alinhadas com avanço fixo e com o espaçamento preservado, e um snippet que as
 * escondesse atrás de uma constante esconderia a razão da story.
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
 * alcança. Não é zero, e ainda assim ninguém falhou — quem diz o que aconteceu é
 * o estado.
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
 * consome, e uma peça que a recebesse decidiria ordenação e agrupamento, que são
 * do produto.
 */
export function terminalBlockSequenceSource(): string {
  // A sequência entra no `<script>` do exemplo porque a marcação a ITERA: laço
  // sobre nome que o exemplo não declara não resolve na mão de quem copia. Os
  // três estados são os três casos que uma sequência produz — o que terminou
  // bem, o que quebrou e o que ainda não rodou.
  const script = [
    IMPORT,
    '',
    'const rotulos = { /* os rótulos do bloco */ };',
    '',
    "const sequencia = ['complete', 'failed', 'idle'].map((status) => ({",
    '  id: status,',
    `  command: ${text(COMMAND)},`,
    '  lines: saidaDe(status),',
    '  status,',
    '  exitCode: codigoDe(status),',
    '}));',
    DECL_POR_ESTADO,
  ].join('\n');

  const markup = [
    '<div class="nds-stack nds-max-w-lg" data-spacing="lg">',
    '  {#each sequencia as passo (passo.id)}',
    '    <TerminalBlock',
    '      command={passo.command}',
    '      lines={passo.lines}',
    '      status={passo.status}',
    '      exitCode={passo.exitCode}',
    `      ${LABELS}`,
    '    />',
    '  {/each}',
    '</div>',
  ].join('\n');

  return svelteSnippet(script, markup);
}

/**
 * A peça abaixo da linha de estado da execução.
 *
 * Elas são AUTÔNOMAS e respondem a perguntas diferentes: uma diz em que pé está
 * a resposta inteira e carrega as ações de parar e repetir, a outra mostra o que
 * um comando dentro dela escreveu. Por isso o snippet empilha as duas em
 * sequência, e não passa uma para dentro da outra.
 */
export function terminalBlockBesideRunSource(): string {
  const markup = [
    '<div class="nds-stack nds-max-w-lg" data-spacing="lg">',
    '  <AgentStatus status="running" elapsed="0:42" labels={rotulosDaExecucao} />',
    '  <TerminalBlock',
    `    command=${text(COMMAND)}`,
    '    lines={saida}',
    '    status="running"',
    `    ${LABELS}`,
    '  />',
    '</div>',
  ].join('\n');

  return svelteSnippet(
    script(
      [IMPORT, IMPORT_RUN],
      '',
      'const rotulosDaExecucao = { /* os rótulos da linha de estado */ };',
      declSaida('saida'),
    ),
    markup,
  );
}

/**
 * A saída longa, que rola dentro do próprio bloco.
 *
 * O teto entra no snippet como custom property, e não como altura em `style`: é
 * a única maneira de mudá-lo sem tirar o valor do tema e da escala de tipo — e
 * ele é em `rem` para crescer com a fonte do navegador em vez de espremer mais
 * linhas no mesmo espaço.
 */
export function terminalBlockLongOutputSource(): string {
  const attributes = attrsMultilinha([
    `command=${text(COMMAND)}`,
    'lines={saidaLonga}',
    'status="complete"',
    'exitCode={0}',
    LABELS,
  ]);

  const markup = [
    `<TerminalBlock${attributes} />`,
    '',
    '<style>',
    '  /* O teto da caixa que rola, na folha de quem consome. */',
    '  :global(.nds-terminal-block) {',
    '    --terminal-block-max-block-size: 12rem;',
    '  }',
    '</style>',
  ].join('\n');

  return svelteSnippet(script([IMPORT], declSaida('saidaLonga')), markup);
}
