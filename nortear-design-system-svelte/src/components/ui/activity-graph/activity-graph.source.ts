/**
 * Transforms do painel Code da grade de atividade.
 *
 * Módulo de TS puro, sem import de `.svelte`: é o que deixa as funções
 * rodarem fora do navegador — a saída do painel não chega ao DOM durante a
 * `play`.
 *
 * Existem porque nesta stack o docgen está DESLIGADO: sem transform, o
 * gerador monta a tag a partir do nome interno da função compilada e publica
 * `<wrapper …/>`, que não é um componente que alguém possa importar.
 *
 * Cada configuração tem a SUA função exportada, chamável SEM argumento.
 * Fábrica curried devolveria função em vez de string, e as checagens que leem
 * o snippet nunca chegariam ao snippet. O sufixo `Source`/`Snippet` fica no
 * FIM do nome de propósito: a guarda que varre os construtores de snippet
 * procura por ele ali, e nome fora do padrão sai da varredura em silêncio.
 *
 * A ATIVIDADE ENTRA COMO NOME DE VARIÁVEL, e nunca por extenso — noventa dias
 * com data e contagem ocupariam a tela inteira do painel. A JANELA E A
 * ESCALA, ao contrário, entram POR EXTENSO, e isso é decisão: elas são o que
 * esta peça tem de próprio, e um snippet que as escondesse atrás de um nome
 * ensinaria exatamente o que a peça não é.
 */
import { attrsMultilinha, svelteSnippet } from '@/lib/story-source';

/** O que as stories mudam e que o snippet precisa mostrar. */
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

/** O contexto que o painel Code entrega à transform. */
type StoryContext = {
  args?: { status?: string; withActivity?: boolean; weekStart?: number };
};

const IMPORT = "import { ActivityGraph } from '@/components/ui/activity-graph';";

/** O uso real: os dias, a janela, a escala, o estado da execução e os rótulos. */
function build(opts: ActivityGraphSnippetOptions): string {
  const attributes = attrsMultilinha([
    `days={${opts.daysRef ?? 'atividade'}}`,
    `start="${opts.start ?? '2026-01-01'}"`,
    `end="${opts.end ?? '2026-03-31'}"`,
    `thresholds={${opts.thresholdsRef ?? '[1, 4, 8, 13]'}}`,
    opts.weekStart === undefined ? undefined : `weekStart={${opts.weekStart}}`,
    `status="${opts.status ?? 'complete'}"`,
    'labels={rotulos}',
  ]);

  return svelteSnippet(IMPORT, `<ActivityGraph${attributes} />`);
}

/** Transform do `meta` — o Playground, que escreve os eixos por extenso. */
export function activityGraphSource(_generated?: unknown, ctx?: StoryContext): string {
  const args = ctx?.args ?? {};
  return build({
    status: args.status,
    // Sem atividade nenhuma a chamada continua existindo, e é o que a story
    // mostra: janela vazia é grade, e não ausência de resposta.
    daysRef: args.withActivity === false ? '[]' : 'atividade',
    weekStart: args.weekStart ? String(args.weekStart) : undefined,
  });
}

/** A escala inteira, do vazio ao nível cheio. */
export function activityGraphScaleSnippet(): string {
  const attributes = attrsMultilinha([
    'days={atividadeDaEscala}',
    'start="2026-03-01"',
    'end="2026-03-07"',
    'thresholds={[1, 4, 8, 13]}',
    'status="complete"',
    'labels={rotulos}',
  ]);

  const markup = [
    '<!--',
    '  Um dia por nível, na mesma janela: cada degrau da escala cresce em',
    '  DUAS coisas ao mesmo tempo — a força da tinta e o tamanho do quadrado',
    '  dentro da casa —, e a palavra de cada um chega a quem não vê nenhuma',
    '  das duas.',
    '-->',
    `<ActivityGraph${attributes} />`,
  ].join('\n');

  return svelteSnippet(IMPORT, markup);
}

/** A janela sem atividade nenhuma, que continua sendo uma grade. */
export function activityGraphEmptySnippet(): string {
  const attributes = attrsMultilinha([
    'days={[]}',
    'start="2026-01-01"',
    'end="2026-03-31"',
    'thresholds={[1, 4, 8, 13]}',
    'status="complete"',
    'labels={rotulos}',
  ]);

  const markup = [
    '<!--',
    '  GRADE VAZIA É GRADE, e é a diferença desta peça em relação às irmãs',
    '  da família: um período em que nada aconteceu É a resposta, e devolver',
    '  nada esconderia justamente essa informação.',
    '-->',
    `<ActivityGraph${attributes} />`,
  ].join('\n');

  return svelteSnippet(IMPORT, markup);
}

/** Enquanto a grade se escreve, com a execução ocupada. */
export function activityGraphBusySnippet(): string {
  return build({ status: 'running' });
}

/** Uma janela que não existe: o fim antes do começo. */
export function activityGraphNoWindowSnippet(): string {
  const attributes = attrsMultilinha([
    'days={atividade}',
    'start="2026-03-31"',
    'end="2026-01-01"',
    'thresholds={[1, 4, 8, 13]}',
    'status="complete"',
    'labels={rotulos}',
  ]);

  const markup = [
    '<!--',
    '  FIM ANTES DO COMEÇO NÃO É JANELA, e sem janela não há posição — a',
    '  peça não desenha marcação nenhuma, nem moldura nem parada de',
    '  teclado.',
    '-->',
    `<ActivityGraph${attributes} />`,
  ].join('\n');

  return svelteSnippet(IMPORT, markup);
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
 * O tamanho da casa e o vão, na folha de quem consome.
 *
 * É ele que decide quando a grade passa a ser mais larga que a conversa. E
 * "a folha dele", nesta stack, é um bloco de estilo escopado: a folha
 * DECLARA as duas propriedades no próprio `.nds-activity-graph`, e
 * declaração no elemento vence valor herdado — pôr a propriedade num
 * invólucro ficaria sem efeito nenhum. Por isso a regra sai com
 * especificidade maior, escopada ao invólucro para não vazar para o resto da
 * página, com `:global` para alcançar a classe da folha compartilhada.
 */
export function activityGraphTightCellsSnippet(): string {
  const markup = [
    '<div data-apertado>',
    '  <ActivityGraph',
    '    days={atividade}',
    '    start="2026-01-01"',
    '    end="2026-03-31"',
    '    thresholds={[1, 4, 8, 13]}',
    '    status="complete"',
    '    labels={rotulos}',
    '  />',
    '</div>',
    '',
    '<style>',
    '  /* O tamanho da casa e o vão, na folha de quem consome. */',
    '  [data-apertado] :global(.nds-activity-graph) {',
    '    --activity-graph-cell: var(--spacing-2);',
    '    --activity-graph-gap: var(--spacing-px);',
    '  }',
    '</style>',
  ].join('\n');

  return svelteSnippet(IMPORT, markup);
}
