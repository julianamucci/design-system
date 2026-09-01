/**
 * Transforms do painel Code da cascata de trechos.
 *
 * O renderer desta stack imprime no painel o `template` da story como está
 * escrito, com os bindings apontando para membros que só existem no arquivo
 * de story. O que se copia tem de ser o uso REAL: um componente que declara
 * os trechos, o eixo e os rótulos.
 *
 * Cada configuração tem a SUA função exportada, chamável SEM argumento.
 * Fábrica curried devolveria função em vez de string, e as checagens que leem
 * o snippet (`source-snippets.test.ts`) nunca chegariam ao snippet.
 *
 * OS TRECHOS ENTRAM COMO NOME DE MEMBRO, e nunca por extenso. Seis trechos
 * com seis campos cada ocupariam a tela inteira do painel e não ensinariam
 * nada que o contrato já não diga — o que o snippet mostra é a CHAMADA, e o
 * que ela precisa: uma lista de trechos, um eixo e os rótulos.
 *
 * TODO BINDING DO TEMPLATE É MEMBRO DECLARADO no próprio snippet, e não uma
 * constante importada no topo: expressão de template do Angular só enxerga
 * membro de classe, e quem copiasse receberia um binding que não resolve.
 *
 * Cada linha é item de um `join('\n')`, e não uma linha de template literal
 * recuado: o recuo entraria no snippet que a pessoa copia.
 */

const IMPORT = "import { NdsTraceWaterfall } from '@/components/ui/trace-waterfall';";

/** O que as stories usam da API e que o snippet precisa mostrar. */
export type TraceWaterfallSnippetOptions = {
  /** Em que pé está a execução que escreve o rastro. */
  status?: string;
  /** A expressão que produz os trechos. */
  spansExpression?: string;
  /** O eixo, já escrito como expressão. */
  totalMsExpression?: string;
  /** Linhas de comentário logo acima da peça, quando o desenho pede explicação. */
  note?: string[];
};

/** O corpo do `@Component`, com o que a story de fato liga. */
function build(header: string[], inner: string[], body: string[]): string {
  return [
    ...header,
    '',
    '@Component({',
    '  imports: [NdsTraceWaterfall],',
    '  template: `',
    ...inner,
    '  `,',
    '})',
    'export class Example {',
    ...body,
    '}',
  ].join('\n');
}

/** A peça, com as entradas que a configuração pede. */
function piece(opts: TraceWaterfallSnippetOptions, indent = '    '): string[] {
  return [
    `${indent}<div`,
    `${indent}  ndsTraceWaterfall`,
    `${indent}  [spans]="${opts.spansExpression ?? 'trechos'}"`,
    `${indent}  [totalMs]="${opts.totalMsExpression ?? '1200'}"`,
    `${indent}  status="${opts.status ?? 'running'}"`,
    `${indent}  [labels]="rotulos"`,
    `${indent}></div>`,
  ];
}

/**
 * O membro que uma expressão de trechos liga, ou nada quando ela não liga
 * nenhum.
 *
 * O IDENTIFICADOR RAIZ, e não o nome inteiro: `trechos.slice(0, 3)` liga
 * `trechos`, e `[]` não liga membro nenhum. Uma versão anterior desta função
 * procurava a palavra `trechos` com fronteira, e por isso `trechosLargos`,
 * `trechosLongos` e `trechosDaJanela` saíam do snippet SEM declaração — três
 * templates ligando membro que a classe não tinha. O `npm run build` e o
 * `npm run lint` passaram nos três; quem os pegou foi `source-snippets.test.ts`,
 * que é o único portão que lê o texto do snippet.
 */
function spansMember(expression: string): string | null {
  return /^([A-Za-z_$][\w$]*)/.exec(expression.trim())?.[1] ?? null;
}

/** A peça sozinha, na configuração que a story desenha. */
function single(opts: TraceWaterfallSnippetOptions): string {
  const spansExpression = opts.spansExpression ?? 'trechos';
  // Sem trecho nenhum a chamada continua existindo, e é o que a story mostra:
  // a peça é que decide se alguma coisa chega à tela.
  const member = spansMember(spansExpression);

  return build(
    [IMPORT],
    [...(opts.note ?? []), ...piece({ ...opts, spansExpression })],
    [
      ...(member
        ? [
            '  // Os trechos vêm de quem monta a cascata: o endereço, o rótulo, o',
            '  // começo, a duração, o recuo e o estado.',
            `  readonly ${member} = [/* os trechos do rastro */];`,
          ]
        : []),
      '  readonly rotulos = traceWaterfallLabels();',
    ],
  );
}

/**
 * Transform do `meta` — o Playground, que escreve os eixos por extenso.
 *
 * Os args vêm dos controls: o estado, quantos trechos entram e o eixo.
 */
export const traceWaterfallSource = (
  _code: string,
  ctx?: { args?: { status?: string; revealed?: number; totalMs?: number } },
): string => {
  const args = ctx?.args ?? {};
  return single({
    status: args.status,
    // Sem trecho nenhum a chamada continua existindo, e é o que a story
    // mostra: a guarda é que decide se alguma coisa chega à tela.
    spansExpression: args.revealed === 0 ? '[]' : 'trechos',
    totalMsExpression: args.totalMs === undefined ? undefined : String(args.totalMs),
  });
};

/** Os quatro estados de trecho, na mesma régua. */
export function traceWaterfallEveryStateSnippet(): string {
  return single({
    status: 'complete',
    note: [
      '    <!-- Um trecho por estado, na mesma régua: os quatro têm forma própria —',
      '         na marca e no preenchimento da barra —, e não só cor. A palavra de',
      '         cada um chega a quem não vê a forma. -->',
    ],
  });
}

/** Um trecho que quebrou. */
export function traceWaterfallFailureSnippet(): string {
  return single({ status: 'failed' });
}

/** Em andamento, com a execução ocupada. */
export function traceWaterfallRunningSnippet(): string {
  return single({ status: 'running' });
}

/**
 * O rastro pela metade — a revelação feita como esta família a faz.
 *
 * Não há contador de revelação: quem quer revelar corta a lista de trechos, e
 * o EIXO CONTINUA O MESMO — é isso que faz as barras restantes guardarem a
 * posição verdadeira em vez de reescalarem.
 */
export function traceWaterfallPartialSnippet(): string {
  return single({
    status: 'running',
    spansExpression: 'trechos.slice(0, 3)',
    note: [
      '    <!-- REVELAR É PASSAR MENOS TRECHOS, mantendo o eixo. As barras que',
      '         sobram guardam a posição verdadeira em vez de reescalarem para',
      '         ocupar a régua inteira. -->',
    ],
  });
}

/** Mais largo que a conversa: a camada rola, e é a única que rola. */
export function traceWaterfallWideSnippet(): string {
  return single({ status: 'running', spansExpression: 'trechosLargos', totalMsExpression: '4000' });
}

/** Rótulos longos, que alargam a coluna em vez de cortar. */
export function traceWaterfallLongLabelsSnippet(): string {
  return single({ status: 'running', spansExpression: 'trechosLongos', totalMsExpression: '900' });
}

/** Uma janela do rastro: o eixo é menor que os trechos que ele mostra. */
export function traceWaterfallClippedSnippet(): string {
  return single({
    status: 'running',
    spansExpression: 'trechosDaJanela',
    totalMsExpression: '600',
    note: [
      '    <!-- A JANELA: um eixo menor que o rastro recorta as barras das pontas,',
      '         e cada linha recortada avisa em palavras que o trecho continua',
      '         fora dela. -->',
    ],
  });
}

/**
 * As duas larguras mínimas, na folha de quem consome.
 *
 * São elas que decidem quando a cascata passa a ser mais larga que a
 * conversa. Entram como propriedade personalizada, e não como largura em
 * estilo embutido: é a única maneira de mudá-las sem tirar o valor do tema e
 * da escala de tipo.
 */
export function traceWaterfallTightColumnsSnippet(): string {
  return [
    single({ status: 'running' }),
    '',
    '/* As duas larguras MÍNIMAS, na folha de quem consome. */',
    '.nds-trace-waterfall {',
    '  --trace-waterfall-name-min: var(--spacing-16);',
    '  --trace-waterfall-axis-min: var(--spacing-20);',
    '}',
  ].join('\n');
}
