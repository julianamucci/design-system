/**
 * Transforms do painel Code da grade de atividade.
 *
 * O renderer desta stack imprime no painel o `template` da story como está
 * escrito, com os bindings apontando para membros que só existem no arquivo
 * de story. O que se copia tem de ser o uso REAL: um componente que declara
 * os dias, a janela, a escala e os rótulos.
 *
 * Cada configuração tem a SUA função exportada, chamável SEM argumento.
 * Fábrica curried devolveria função em vez de string, e as checagens que leem
 * o snippet (`source-snippets.test.ts`) nunca chegariam ao snippet.
 *
 * A ATIVIDADE ENTRA COMO NOME DE MEMBRO, e nunca por extenso — noventa dias
 * com data e contagem ocupariam a tela inteira do painel. A JANELA E A
 * ESCALA, ao contrário, entram POR EXTENSO na marcação (a data como texto, os
 * degraus como membro nomeado): são o que esta peça tem de próprio, e um
 * snippet que as escondesse atrás de um nome ensinaria exatamente o que a
 * peça não é.
 *
 * TODO BINDING DO TEMPLATE É MEMBRO DECLARADO no próprio snippet, e não uma
 * constante importada no topo: expressão de template do Angular só enxerga
 * membro de classe, e quem copiasse receberia um binding que não resolve.
 *
 * Cada linha é item de um `join('\n')`, e não uma linha de template literal
 * recuado: o recuo entraria no snippet que a pessoa copia.
 */

const IMPORT = "import { NdsActivityGraph } from '@/components/ui/activity-graph';";

/** O que as stories usam da API e que o snippet precisa mostrar. */
export type ActivityGraphSnippetOptions = {
  /** Em que pé está a execução que escreve a grade. */
  status?: string;
  /** A expressão que produz os dias. */
  daysExpression?: string;
  /** O primeiro dia da janela. */
  start?: string;
  /** O último dia da janela. */
  end?: string;
  /** A expressão que produz os degraus da escala. */
  thresholdsExpression?: string;
  /** Em que dia a semana começa, já escrito como expressão — quando não é o padrão. */
  weekStartExpression?: string;
  /** Linhas de comentário logo acima da peça, quando o desenho pede explicação. */
  note?: string[];
};

/** O corpo do `@Component`, com o que a story de fato liga. */
function build(header: string[], inner: string[], body: string[]): string {
  return [
    ...header,
    '',
    '@Component({',
    '  imports: [NdsActivityGraph],',
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
function piece(opts: ActivityGraphSnippetOptions, indent = '    '): string[] {
  const lines = [
    `${indent}<div`,
    `${indent}  ndsActivityGraph`,
    `${indent}  [days]="${opts.daysExpression ?? 'atividade'}"`,
    `${indent}  start="${opts.start ?? '2026-01-01'}"`,
    `${indent}  end="${opts.end ?? '2026-03-31'}"`,
    `${indent}  [thresholds]="${opts.thresholdsExpression ?? 'degraus'}"`,
  ];
  if (opts.weekStartExpression) {
    lines.push(`${indent}  [weekStart]="${opts.weekStartExpression}"`);
  }
  lines.push(
    `${indent}  status="${opts.status ?? 'complete'}"`,
    `${indent}  [labels]="rotulos"`,
    `${indent}></div>`,
  );
  return lines;
}

/**
 * O membro que uma expressão liga, ou nada quando ela não liga nenhum.
 *
 * O IDENTIFICADOR RAIZ, e não o nome inteiro: `atividade.slice(0, 3)` liga
 * `atividade`, e `[]` não liga membro nenhum. Ver a nota do `spansMember` em
 * `trace-waterfall.source.ts` — a mesma cautela vale aqui: um seletor por
 * fronteira de palavra já deixou membro renomeado sem declaração no snippet,
 * e nenhum build ou lint alcança esse defeito porque ele mora dentro de uma
 * string.
 */
function rootMember(expression: string): string | null {
  return /^([A-Za-z_$][\w$]*)/.exec(expression.trim())?.[1] ?? null;
}

/** A peça sozinha, na configuração que a story desenha. */
function single(opts: ActivityGraphSnippetOptions): string {
  const daysExpression = opts.daysExpression ?? 'atividade';
  const thresholdsExpression = opts.thresholdsExpression ?? 'degraus';
  const daysMember = rootMember(daysExpression);
  const thresholdsMember = rootMember(thresholdsExpression);

  const body: string[] = [];
  // SEM ATIVIDADE NENHUMA A CHAMADA CONTINUA EXISTINDO: o `[]` não liga
  // membro, e é o que a story mostra — janela vazia é grade, e não ausência
  // de resposta.
  if (daysMember) {
    body.push(
      '  // O que aconteceu, dia a dia: a data e a contagem. Dia repetido soma.',
      `  readonly ${daysMember}: readonly ActivityDay[] = [/* o que aconteceu, dia a dia */];`,
    );
  }
  if (thresholdsMember) {
    body.push(
      '  // Os degraus da escala, em contagem — obrigatório e DECLARADO, nunca',
      '  // derivado do maior valor.',
      `  readonly ${thresholdsMember}: readonly number[] = [1, 4, 8, 13];`,
    );
  }
  body.push('  readonly rotulos = activityGraphLabels();');

  return build(
    [IMPORT],
    [...(opts.note ?? []), ...piece({ ...opts, daysExpression, thresholdsExpression })],
    body,
  );
}

/**
 * Transform do `meta` — o Playground, que escreve a janela por extenso.
 *
 * Os args vêm dos controls: o estado, se há atividade e o começo da semana.
 */
export const activityGraphSource = (
  _code: string,
  ctx?: { args?: { status?: string; withActivity?: boolean; weekStart?: number } },
): string => {
  const args = ctx?.args ?? {};
  return single({
    status: args.status,
    // Sem atividade nenhuma a chamada continua existindo, e é o que a story
    // mostra: janela vazia é grade, e não ausência de resposta.
    daysExpression: args.withActivity === false ? '[]' : 'atividade',
    weekStartExpression: args.weekStart ? String(args.weekStart) : undefined,
  });
};

/** A escala inteira, do vazio ao nível cheio. */
export function activityGraphScaleSnippet(): string {
  return single({
    status: 'complete',
    daysExpression: 'atividadeDaEscala',
    start: '2026-03-01',
    end: '2026-03-07',
    note: [
      '    <!-- Um dia por nível, na mesma janela: cada degrau da escala cresce em DUAS',
      '         coisas ao mesmo tempo — a força da tinta e o tamanho do quadrado dentro',
      '         da casa —, e a palavra de cada um chega a quem não vê nenhuma das duas. -->',
    ],
  });
}

/** A janela sem atividade nenhuma, que continua sendo uma grade. */
export function activityGraphEmptySnippet(): string {
  return single({
    status: 'complete',
    daysExpression: '[]',
    note: [
      '    <!-- GRADE VAZIA É GRADE, e é a diferença desta peça em relação às irmãs da',
      '         família: um período em que nada aconteceu É a resposta, e devolver nada',
      '         esconderia justamente essa informação. -->',
    ],
  });
}

/** Enquanto a grade se escreve, com a execução ocupada. */
export function activityGraphBusySnippet(): string {
  return single({ status: 'running' });
}

/** Uma janela que não existe: o fim antes do começo. */
export function activityGraphNoWindowSnippet(): string {
  return single({
    start: '2026-03-31',
    end: '2026-01-01',
    note: [
      '    <!-- FIM ANTES DO COMEÇO NÃO É JANELA: sem janela não há posição, e nada é',
      '         desenhado dentro do host — nem total, nem camada que rola. -->',
    ],
  });
}

/** Um mês só, porque a janela é dado. */
export function activityGraphMonthSnippet(): string {
  return single({ start: '2026-03-01', end: '2026-03-31' });
}

/** Um ano inteiro: mais largo que a conversa, e a camada rola. */
export function activityGraphYearSnippet(): string {
  return single({ start: '2025-04-01', end: '2026-03-31' });
}

/** A semana começando na segunda. */
export function activityGraphWeekStartSnippet(): string {
  return single({ weekStartExpression: '1' });
}

/**
 * O tamanho da casa, na folha de quem consome.
 *
 * É ele que decide quando a grade passa a ser mais larga que a conversa.
 * Entra como propriedade personalizada, e não como largura em `style`: é a
 * única maneira de mudá-lo sem tirar o valor do tema e da escala de tipo.
 */
export function activityGraphTightCellsSnippet(): string {
  return [
    single({}),
    '',
    '/* O tamanho da casa e o vão, na folha de quem consome. */',
    '.nds-activity-graph {',
    '  --activity-graph-cell: var(--spacing-2);',
    '  --activity-graph-gap: var(--spacing-px);',
    '}',
  ].join('\n');
}
