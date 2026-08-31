/**
 * Transforms do painel Code do bloco de terminal.
 *
 * O renderer desta stack imprime no painel o `template` da story como está
 * escrito, com os bindings apontando para `props` que só existem no arquivo. O
 * que se copia tem de ser o uso REAL: um componente que declara os rótulos e a
 * saída que recebeu.
 *
 * Cada configuração tem a SUA função exportada, chamável SEM argumento. Fábrica
 * curried devolveria função em vez de string, e as checagens que leem o snippet
 * (`source-snippets.test.ts`) nunca chegariam ao snippet.
 *
 * AS LINHAS ENTRAM POR EXTENSO em quase todos, e é decisão. O assunto desta peça
 * é o que acontece com a saída — a coluna que só fecha com avanço fixo, a linha
 * mais larga que o bloco, o comando que não escreveu nada —, e um snippet que
 * mostrasse só o nome de um sinal esconderia justamente o que a story
 * fotografa. Onde a lista é longa demais para o painel, o snippet nomeia a
 * constante e diz o que ela tem.
 *
 * TODO BINDING DO TEMPLATE É MEMBRO DECLARADO no próprio snippet, e não uma
 * constante importada no topo: expressão de template do Angular só enxerga
 * membro de classe, e quem copiasse receberia um binding que não resolve.
 *
 * Cada linha é item de um `join('\n')`, e não uma linha de template literal
 * recuado: o recuo entraria no snippet que a pessoa copia.
 */

const IMPORT = "import { NdsTerminalBlock } from '@/components/ui/terminal-block';";

const RUN_IMPORT = "import { NdsAgentStatus } from '@/components/ui/agent-status';";

const PROTOCOL_IMPORT = "import { RUN_STATUSES } from '@shared/primitives/chat-protocol';";

/** O comando das demonstrações. É o mesmo em toda foto. */
const COMMAND = 'npm run build --workspace @nortear/ds';

/** O que as stories usam da API e que o snippet precisa mostrar. */
export type TerminalBlockSnippetOptions = {
  /** Em que pé está o comando. */
  status?: string;
  /** As linhas da saída, por extenso. Vazio é "não escreveu nada". */
  lines?: readonly string[];
  /** O que o processo devolveu. Só existe depois do fim. */
  exitCode?: number;
  /** O que declarar no lugar da lista, quando ela é longa demais para o painel. */
  linesMember?: string[];
};

/** O tipo que o painel Code espera: recebe o gerado e os args, devolve o uso. */
export type TerminalBlockSourceTransform = (
  code: string,
  ctx?: { args?: { status?: string; exitCode?: number; withOutput?: boolean } },
) => string;

/** O corpo do `@Component`, com o que a story de fato liga. */
function build(header: string[], used: string[], inner: string[], body: string[]): string {
  return [
    ...header,
    '',
    '@Component({',
    `  imports: [${used.join(', ')}],`,
    '  template: `',
    ...inner,
    '  `,',
    '})',
    'export class Example {',
    ...body,
    '}',
  ].join('\n');
}

/**
 * Uma cadeia entre aspas simples, como o resto do design system a escreve.
 *
 * Aspas simples e não `JSON.stringify`: o snippet é código que alguém copia
 * para dentro deste repositório, e a aspa dupla reprovaria o lint dele.
 */
function text(value: string): string {
  return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

/** `readonly lines = [ … ];`, escrito por extenso. */
function linesLiteral(lines: readonly string[]): string[] {
  return [
    '  // O que o comando escreveu, na ordem em que escreveu. Quem fatia é quem',
    '  // consome: a peça desenha as linhas que recebe.',
    '  readonly lines = [',
    ...lines.map((line) => `    ${text(line)},`),
    '  ];',
  ];
}

/** A peça sozinha, na configuração que a story desenha. */
function single(opts: TerminalBlockSnippetOptions): string {
  const status = opts.status ?? 'running';
  const declaration =
    opts.linesMember ?? (opts.lines && opts.lines.length > 0 ? linesLiteral(opts.lines) : undefined);

  return build(
    [IMPORT],
    ['NdsTerminalBlock'],
    [
      '    <div',
      '      ndsTerminalBlock',
      `      command="${COMMAND}"`,
      ...(declaration ? ['      [lines]="lines"'] : []),
      `      status="${status}"`,
      // O número só existe depois do fim, e o snippet acompanha: ensinar a
      // mandá-lo com a execução em curso ensinaria a mandar um resultado que
      // ainda não aconteceu.
      ...(opts.exitCode === undefined ? [] : [`      [exitCode]="${opts.exitCode}"`]),
      '      [labels]="labels"',
      '    ></div>',
    ],
    [
      ...(declaration ?? []),
      ...(declaration ? [''] : []),
      '  readonly labels = terminalBlockLabels();',
    ],
  );
}

/**
 * Transform do `meta` — o Playground, que escreve os eixos por extenso.
 *
 * Os args vêm dos controls: o estado, o número e se houve saída.
 */
export const terminalBlockSource: TerminalBlockSourceTransform = (_code, ctx) => {
  const args = ctx?.args ?? {};
  return single({
    status: args.status,
    lines:
      args.withOutput === false
        ? undefined
        : [
            'vite v7.1.0 building for production...',
            'transforming (412) src/components/ui/terminal-block.ts',
          ],
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
  return build(
    [IMPORT, PROTOCOL_IMPORT],
    ['NdsTerminalBlock'],
    [
      '    @for (status of statuses; track status) {',
      '      <div',
      '        ndsTerminalBlock',
      `        command="${COMMAND}"`,
      '        [lines]="runs[status].lines"',
      '        [status]="status"',
      '        [exitCode]="runs[status].exitCode"',
      '        [labels]="labels"',
      '      ></div>',
      '    }',
    ],
    [
      '  readonly statuses = RUN_STATUSES;',
      '',
      '  // O que cada execução escreveu, e o que ela devolveu ao terminar. Vem de',
      '  // quem executou: a peça desenha o que recebe, e é o vocabulário que decide',
      '  // quando o número já pode aparecer.',
      '  readonly runs = runsByStatus;',
      '',
      '  readonly labels = terminalBlockLabels();',
    ],
  );
}

/** Enquanto a saída chega: a peça se declara ocupada e o cursor aparece. */
export function terminalBlockRunningSource(): string {
  return single({
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
  return single({
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
 * horizontal dentro do próprio bloco, e sem vê-la o snippet não ensina o que a
 * decisão 7 da folha existe para não errar.
 */
export function terminalBlockFailedSource(): string {
  return single({
    status: 'failed',
    exitCode: 1,
    lines: [
      'src/components/ui/terminal-block.ts:142:18 - error TS2554: Expected 2 arguments, but got 1. The second argument is required because the component reads the labels from it.',
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
  return single({
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
  return single({ status: 'complete', exitCode: 0 });
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
  return build(
    [IMPORT],
    ['NdsTerminalBlock'],
    [
      '    @for (step of sequence; track step.command) {',
      '      <div',
      '        ndsTerminalBlock',
      '        [command]="step.command"',
      '        [lines]="step.lines"',
      '        [status]="step.status"',
      '        [exitCode]="step.exitCode"',
      '        [labels]="labels"',
      '      ></div>',
      '    }',
    ],
    [
      '  // A sequência é de quem consome: a peça desenha UM comando, e empilhá-las',
      '  // é o que produz a sequência.',
      '  readonly sequence = commandSequence;',
      '',
      '  readonly labels = terminalBlockLabels();',
    ],
  );
}

/**
 * A peça abaixo da linha de estado da execução.
 *
 * Elas são AUTÔNOMAS e respondem a perguntas diferentes: uma diz em que pé está
 * a resposta inteira e carrega as ações de parar e repetir, a outra mostra o que
 * um comando dentro dela escreveu. Por isso o snippet monta as duas em
 * sequência, e não passa uma para dentro da outra.
 */
export function terminalBlockBesideRunSource(): string {
  return build(
    [RUN_IMPORT, IMPORT],
    ['NdsAgentStatus', 'NdsTerminalBlock'],
    [
      '    <!-- As duas são AUTÔNOMAS: nenhuma sabe que a outra existe. A linha',
      '         de estado controla a execução; o bloco é o REGISTRO do que rodou. -->',
      '    <p',
      '      ndsAgentStatus',
      '      status="running"',
      '      elapsed="0:42"',
      '      [labels]="runLabels"',
      '    ></p>',
      '',
      '    <div',
      '      ndsTerminalBlock',
      `      command="${COMMAND}"`,
      '      [lines]="lines"',
      '      status="running"',
      '      [labels]="labels"',
      '    ></div>',
    ],
    [
      '  // Enquanto corre não há código de saída: o resultado ainda não existe.',
      '  readonly lines = [',
      "    'vite v7.1.0 building for production...',",
      "    'transforming (412) src/components/ui/terminal-block.ts',",
      '  ];',
      '',
      '  readonly labels = terminalBlockLabels();',
      '  readonly runLabels = agentStatusLabels();',
    ],
  );
}

/**
 * A saída longa, que rola dentro do próprio bloco.
 *
 * O teto entra como custom property, e não como altura em `style`: é a única
 * maneira de mudá-lo sem tirar o valor do tema e da escala de tipo — e ele é em
 * `rem` para crescer com a fonte do navegador em vez de espremer mais linhas no
 * mesmo espaço.
 */
export function terminalBlockLongOutputSource(): string {
  return [
    single({
      status: 'complete',
      exitCode: 0,
      linesMember: [
        '  // Longa demais para o painel: a lista inteira vem de quem executou.',
        '  readonly lines = longOutput;',
      ],
    }),
    '',
    '/* O teto da caixa que rola, na folha de quem consome. */',
    '.nds-terminal-block {',
    '  --terminal-block-max-block-size: 12rem;',
    '}',
  ].join('\n');
}
