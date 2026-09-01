// Snippet do painel Code da cascata de trechos — ver `@/lib/story-source`.
//
// Cada configuração tem a SUA função exportada, chamável SEM argumento. Fábrica
// curried devolveria função em vez de string, e as checagens que leem o snippet
// nunca chegariam ao snippet.
//
// OS TRECHOS ENTRAM COMO NOME DE VARIÁVEL, e nunca por extenso. Seis trechos com
// seis campos cada ocupariam a tela inteira do painel e não ensinariam nada que
// o contrato já não diga — o que o snippet mostra é a CHAMADA, e o que ela
// precisa: uma lista de trechos, um eixo e os rótulos.

import {
  appendLine,
  callLine,
  importing,
  options,
  snippet,
  text,
  type SourceTransform,
} from '@/lib/story-source';

export type TraceWaterfallSnippetOptions = {
  /** Em que pé está a execução que escreve o rastro. */
  status?: string;
  /** O nome da constante com os trechos. */
  spansRef?: string;
  /** O eixo, já escrito como número. */
  totalRef?: string;
};

function build(opts: TraceWaterfallSnippetOptions): string {
  const lines = options([
    ['spans', opts.spansRef ?? 'trechos'],
    ['totalMs', opts.totalRef ?? '1200'],
    ['status', text(opts.status ?? 'running')],
    ['labels', 'rotulos'],
  ]);

  return snippet(
    importing('trace-waterfall', 'createTraceWaterfall'),
    `const traceWaterfall = ${callLine('createTraceWaterfall', lines)};`,
    // Sem trecho, ou sem eixo, não há cascata — e a fábrica devolve nada. O
    // snippet mostra a guarda porque ela é parte do contrato, e não um detalhe
    // de quem escreveu.
    `if (traceWaterfall) ${appendLine('traceWaterfall')}`,
  );
}

/** Transform do `meta` — o Playground, que escreve os eixos por extenso. */
export const traceWaterfallSource: SourceTransform<{
  status: string;
  revealed: number;
  totalMs: number;
}> = (_c, ctx) => {
  const args = ctx?.args ?? {};
  return build({
    status: args.status,
    // Sem trecho nenhum a chamada continua existindo, e é o que a story mostra:
    // a guarda é que decide se alguma coisa chega à tela.
    spansRef: args.revealed === 0 ? '[]' : 'trechos',
    totalRef: args.totalMs === undefined ? undefined : String(args.totalMs),
  });
};

/** Os quatro estados de trecho, na mesma régua. */
export function traceWaterfallEveryStateSnippet(): string {
  return snippet(
    importing('trace-waterfall', 'createTraceWaterfall'),
    '// Um trecho por estado, na mesma régua: os quatro têm forma própria — na',
    '// marca e no preenchimento da barra —, e não só cor. A palavra de cada um',
    '// chega a quem não vê a forma.',
    `const traceWaterfall = ${callLine('createTraceWaterfall', options([
      ['spans', 'trechos'],
      ['totalMs', '1200'],
      ['status', text('complete')],
      ['labels', 'rotulos'],
    ]))};`,
    `if (traceWaterfall) ${appendLine('traceWaterfall')}`,
  );
}

/** Um trecho que quebrou. */
export function traceWaterfallFailureSnippet(): string {
  return build({ status: 'failed' });
}

/** Em andamento, com a execução ocupada. */
export function traceWaterfallRunningSnippet(): string {
  return build({ status: 'running' });
}

/**
 * O rastro pela metade — a revelação feita como esta família a faz.
 *
 * Não há contador de revelação: quem quer revelar corta a lista de trechos, e o
 * EIXO CONTINUA O MESMO — é isso que faz as barras restantes guardarem a posição
 * verdadeira em vez de reescalarem.
 */
export function traceWaterfallPartialSnippet(): string {
  return snippet(
    importing('trace-waterfall', 'createTraceWaterfall'),
    '// REVELAR É PASSAR MENOS TRECHOS, mantendo o eixo. As barras que sobram',
    '// guardam a posição verdadeira em vez de reescalarem para ocupar a régua.',
    `const traceWaterfall = ${callLine('createTraceWaterfall', options([
      ['spans', 'trechos.slice(0, 3)'],
      ['totalMs', '1200'],
      ['status', text('running')],
      ['labels', 'rotulos'],
    ]))};`,
    `if (traceWaterfall) ${appendLine('traceWaterfall')}`,
  );
}

/** Mais largo que a conversa: a camada rola, e é a única que rola. */
export function traceWaterfallWideSnippet(): string {
  return build({ status: 'running', spansRef: 'trechosLargos', totalRef: '4000' });
}

/** Rótulos longos, que alargam a coluna em vez de cortar. */
export function traceWaterfallLongLabelsSnippet(): string {
  return build({ status: 'running', spansRef: 'trechosLongos', totalRef: '900' });
}

/** Uma janela do rastro: o eixo é menor que os trechos que ele mostra. */
export function traceWaterfallClippedSnippet(): string {
  return snippet(
    importing('trace-waterfall', 'createTraceWaterfall'),
    '// A JANELA: um eixo menor que o rastro recorta as barras das pontas, e cada',
    '// linha recortada avisa em palavras que o trecho continua fora dela.',
    `const traceWaterfall = ${callLine('createTraceWaterfall', options([
      ['spans', 'trechosDaJanela'],
      ['totalMs', '600'],
      ['status', text('running')],
      ['labels', 'rotulos'],
    ]))};`,
    `if (traceWaterfall) ${appendLine('traceWaterfall')}`,
  );
}

/**
 * As duas larguras mínimas, na folha de quem consome.
 *
 * São elas que decidem quando a cascata passa a ser mais larga que a conversa.
 * Entram como propriedade personalizada, e não como largura em `style`: é a
 * única maneira de mudá-las sem tirar o valor do tema e da escala de tipo.
 */
export function traceWaterfallTightColumnsSnippet(): string {
  return snippet(
    importing('trace-waterfall', 'createTraceWaterfall'),
    `const traceWaterfall = ${callLine('createTraceWaterfall', options([
      ['spans', 'trechos'],
      ['totalMs', '1200'],
      ['status', text('running')],
      ['labels', 'rotulos'],
    ]))};`,
    [
      '/* As duas larguras MÍNIMAS, na folha de quem consome. */',
      '.nds-trace-waterfall {',
      '  --trace-waterfall-name-min: var(--spacing-16);',
      '  --trace-waterfall-axis-min: var(--spacing-20);',
      '}',
    ].join('\n'),
    `if (traceWaterfall) ${appendLine('traceWaterfall')}`,
  );
}
