// Snippet do painel Code da grade de atividade — ver `@/lib/story-source`.
//
// Cada configuração tem a SUA função exportada, chamável SEM argumento. Fábrica
// curried devolveria função em vez de string, e as checagens que leem o snippet
// nunca chegariam ao snippet.
//
// A ATIVIDADE ENTRA COMO NOME DE VARIÁVEL, e nunca por extenso — noventa dias
// com data e contagem ocupariam a tela inteira do painel. A JANELA E A ESCALA,
// ao contrário, entram POR EXTENSO, e isso é decisão: elas são o que esta peça
// tem de próprio, e um snippet que as escondesse atrás de um nome ensinaria
// exatamente o que a peça não é.

import {
  appendLine,
  callLine,
  importing,
  options,
  snippet,
  text,
  type SourceTransform,
} from '@/lib/story-source';

export type ActivityGraphSnippetOptions = {
  /** Em que pé está a execução que escreve a grade. */
  status?: string;
  /** O nome da constante com a atividade. */
  daysRef?: string;
  /** O primeiro dia da janela. */
  start?: string;
  /** O último dia da janela. */
  end?: string;
  /** Os degraus da escala, já escritos. */
  thresholdsRef?: string;
  /** Em que dia a semana começa, quando não é o padrão. */
  weekStart?: string;
};

function build(opts: ActivityGraphSnippetOptions): string {
  const lines = options([
    ['days', opts.daysRef ?? 'atividade'],
    ['start', text(opts.start ?? '2026-01-01')],
    ['end', text(opts.end ?? '2026-03-31')],
    ['thresholds', opts.thresholdsRef ?? '[1, 4, 8, 13]'],
    ['weekStart', opts.weekStart],
    ['status', text(opts.status ?? 'complete')],
    ['labels', 'rotulos'],
  ]);

  return snippet(
    importing('activity-graph', 'createActivityGraph'),
    `const activityGraph = ${callLine('createActivityGraph', lines)};`,
    // Sem janela, ou sem escala, não há grade — e a fábrica devolve nada. Sem
    // ATIVIDADE, no entanto, há: o snippet mostra a guarda porque ela é parte do
    // contrato, e não um detalhe de quem escreveu.
    `if (activityGraph) ${appendLine('activityGraph')}`,
  );
}

/** Transform do `meta` — o Playground, que escreve os eixos por extenso. */
export const activityGraphSource: SourceTransform<{
  status: string;
  withActivity: boolean;
  weekStart: number;
}> = (_c, ctx) => {
  const args = ctx?.args ?? {};
  return build({
    status: args.status,
    // Sem atividade nenhuma a chamada continua existindo, e é o que a story
    // mostra: janela vazia é grade, e não ausência de resposta.
    daysRef: args.withActivity === false ? '[]' : 'atividade',
    weekStart: args.weekStart ? String(args.weekStart) : undefined,
  });
};

/** A escala inteira, do vazio ao nível cheio. */
export function activityGraphScaleSnippet(): string {
  return snippet(
    importing('activity-graph', 'createActivityGraph'),
    '// Um dia por nível, na mesma janela: cada degrau da escala cresce em DUAS',
    '// coisas ao mesmo tempo — a força da tinta e o tamanho do quadrado dentro',
    '// da casa —, e a palavra de cada um chega a quem não vê nenhuma das duas.',
    `const activityGraph = ${callLine('createActivityGraph', options([
      ['days', 'atividadeDaEscala'],
      ['start', text('2026-03-01')],
      ['end', text('2026-03-07')],
      ['thresholds', '[1, 4, 8, 13]'],
      ['status', text('complete')],
      ['labels', 'rotulos'],
    ]))};`,
    `if (activityGraph) ${appendLine('activityGraph')}`,
  );
}

/** A janela sem atividade nenhuma, que continua sendo uma grade. */
export function activityGraphEmptySnippet(): string {
  return snippet(
    importing('activity-graph', 'createActivityGraph'),
    '// GRADE VAZIA É GRADE, e é a diferença desta peça em relação às irmãs da',
    '// família: um período em que nada aconteceu É a resposta, e devolver nada',
    '// esconderia justamente essa informação.',
    `const activityGraph = ${callLine('createActivityGraph', options([
      ['days', '[]'],
      ['start', text('2026-01-01')],
      ['end', text('2026-03-31')],
      ['thresholds', '[1, 4, 8, 13]'],
      ['status', text('complete')],
      ['labels', 'rotulos'],
    ]))};`,
    `if (activityGraph) ${appendLine('activityGraph')}`,
  );
}

/** Enquanto a grade se escreve, com a execução ocupada. */
export function activityGraphBusySnippet(): string {
  return build({ status: 'running' });
}

/** Uma janela que não existe: o fim antes do começo. */
export function activityGraphNoWindowSnippet(): string {
  return snippet(
    importing('activity-graph', 'createActivityGraph'),
    '// FIM ANTES DO COMEÇO NÃO É JANELA, e sem janela não há posição — a fábrica',
    '// devolve nada, e nem moldura nem parada de teclado chegam à tela.',
    `const activityGraph = ${callLine('createActivityGraph', options([
      ['days', 'atividade'],
      ['start', text('2026-03-31')],
      ['end', text('2026-01-01')],
      ['thresholds', '[1, 4, 8, 13]'],
      ['status', text('complete')],
      ['labels', 'rotulos'],
    ]))};`,
    `if (activityGraph) ${appendLine('activityGraph')}`,
  );
}

/** Um mês só, porque a janela é dado. */
export function activityGraphMonthSnippet(): string {
  return build({ start: '2026-03-01', end: '2026-03-31' });
}

/** Um ano inteiro: mais largo que a conversa, e a camada rola. */
export function activityGraphYearSnippet(): string {
  return build({ start: '2025-04-01', end: '2026-03-31' });
}

/** A semana começando na segunda. */
export function activityGraphWeekStartSnippet(): string {
  return build({ weekStart: '1' });
}

/**
 * O tamanho da casa, na folha de quem consome.
 *
 * É ele que decide quando a grade passa a ser mais larga que a conversa. Entra
 * como propriedade personalizada, e não como largura em `style`: é a única
 * maneira de mudá-lo sem tirar o valor do tema e da escala de tipo.
 */
export function activityGraphTightCellsSnippet(): string {
  return snippet(
    importing('activity-graph', 'createActivityGraph'),
    `const activityGraph = ${callLine('createActivityGraph', options([
      ['days', 'atividade'],
      ['start', text('2026-01-01')],
      ['end', text('2026-03-31')],
      ['thresholds', '[1, 4, 8, 13]'],
      ['status', text('complete')],
      ['labels', 'rotulos'],
    ]))};`,
    [
      '/* O tamanho da casa e o vão, na folha de quem consome. */',
      '.nds-activity-graph {',
      '  --activity-graph-cell: var(--spacing-2);',
      '  --activity-graph-gap: var(--spacing-px);',
      '}',
    ].join('\n'),
    `if (activityGraph) ${appendLine('activityGraph')}`,
  );
}
