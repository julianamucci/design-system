// Pedaços do Chart que o container E os builders precisam. Vive fora do
// barrel porque o barrel exporta o próprio `.svelte` — importar de lá dentro do
// componente fecharia um ciclo.

import type { EChartsCoreOption } from 'echarts/core';

/**
 * Bloco `aria` comum aos builders.
 *
 * `decal.show` liga a trama por série — é o que cumpre a WCAG 1.4.1 quando a
 * cor sai de cena. `label.enabled: false` desliga a descrição gerada pela lib
 * de propósito: ela nasce em inglês e mora num elemento interno que o
 * `role="img"` do container poda da árvore de acessibilidade; quem carrega a
 * alternativa textual é o `aria-label` autoral, no idioma da página.
 */
export const ARIA = { enabled: true, label: { enabled: false }, decal: { show: true } } as const;

/** Frase padrão do estado vazio — a mesma nas cinco stacks. */
export const CHART_EMPTY_LABEL = 'Sem dados para exibir';

/** O option descreve alguma série com dado? Decide o estado vazio. */
export function isChartOptionEmpty(option: EChartsCoreOption): boolean {
  const series = (option as { series?: unknown }).series;
  const list = Array.isArray(series) ? series : series ? [series] : [];
  if (list.length === 0) return true;
  return list.every((s) => {
    const data = (s as { data?: unknown[] }).data;
    return !Array.isArray(data) || data.length === 0;
  });
}

// ─── Alternativa textual ──────────────────────────────────────────────────────
//
// O desenho é imagem, e `role="img"` PODA a subárvore dele da árvore de
// acessibilidade. Sem alternativa textual ao lado, o conteúdo do gráfico morre
// ali: não há como ler o número, copiá-lo ou achá-lo por busca. Um `<svg>` mudo
// é conteúdo perdido — a tabela É o conteúdo.
//
// A lib não entrega essa alternativa. O que ela tem é `aria.label`, que gera
// uma frase em inglês e a escreve DENTRO do elemento podado — desligado de
// propósito no bloco `ARIA` acima. Quem entrega é o componente, e o que ele
// entrega é uma `<table>` de verdade, com os mesmos números do desenho.
//
// Os números saem do OPTION JÁ MONTADO, que é a mesma fonte que a lib usa para
// desenhar. Lê-los de outro lugar seria manter duas verdades, e elas divergem
// no primeiro dado que mudar.

/** Rótulos das colunas que a tabela escreve — texto de tela, em português. */
export interface ChartTableLabels {
  category: string;
  value: string;
  share: string;
}

export const CHART_TABLE_LABELS: ChartTableLabels = {
  category: 'Categoria',
  value: 'Valor',
  share: 'Participação',
};

/** Célula sem dado: a categoria existe, aquela série não a preenche. */
const NO_DATA = '—';

/** A tabela pronta para desenhar — tudo já em texto, nada a formatar depois. */
export interface ChartTable {
  header: string[];
  rows: string[][];
}

/** Número curto o bastante para caber na célula, sem depender de locale. */
export function formatChartValue(value: number): string {
  if (Number.isInteger(value)) return String(value);
  return String(Math.round(value * 100) / 100);
}

interface SeriesShape {
  name?: unknown;
  type?: unknown;
  data?: unknown;
}

function seriesOf(option: EChartsCoreOption): SeriesShape[] {
  const series = (option as { series?: unknown }).series;
  if (Array.isArray(series)) return series as SeriesShape[];
  return series ? [series as SeriesShape] : [];
}

/**
 * O número de um ponto de dado.
 *
 * A lib aceita as duas formas — `73` e `{ name, value }` —, e a pizza usa a
 * segunda. Ler só uma delas devolveria uma tabela de travessões ao lado de um
 * desenho cheio.
 */
function valueOf(item: unknown): number | undefined {
  if (typeof item === 'number') return Number.isFinite(item) ? item : undefined;
  if (item && typeof item === 'object') {
    const raw = (item as { value?: unknown }).value;
    if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  }
  return undefined;
}

function cellOf(item: unknown): string {
  const value = valueOf(item);
  return value === undefined ? NO_DATA : formatChartValue(value);
}

/** Nome de uma fatia. Sem nome escrito, a posição é o que resta de rótulo. */
function sliceLabelOf(item: unknown, index: number): string {
  if (item && typeof item === 'object') {
    const raw = (item as { name?: unknown }).name;
    if (typeof raw === 'string' && raw) return raw;
  }
  return String(index + 1);
}

function axisLabelOf(item: unknown, index: number): string {
  if (typeof item === 'string' || typeof item === 'number') return String(item);
  if (item && typeof item === 'object') {
    const raw = (item as { value?: unknown }).value;
    if (typeof raw === 'string' || typeof raw === 'number') return String(raw);
  }
  return String(index + 1);
}

/** Categorias do eixo. Sem eixo escrito, a posição é o rótulo da linha. */
function categoriesOf(option: EChartsCoreOption, count: number): string[] {
  const axis = (option as { xAxis?: unknown }).xAxis;
  const first = Array.isArray(axis) ? axis[0] : axis;
  const written = (first as { data?: unknown } | undefined)?.data;
  if (Array.isArray(written) && written.length > 0) return written.map(axisLabelOf);
  return Array.from({ length: count }, (_, index) => String(index + 1));
}

/** Participação da fatia no total, com uma casa. `—` quando não há total. */
function shareOf(value: number, total: number): string {
  if (total <= 0) return NO_DATA;
  return `${Math.round((Math.max(0, value) / total) * 1000) / 10}%`;
}

/**
 * Os números do desenho em forma de tabela: uma coluna por série, uma linha por
 * categoria — e, na pizza, a participação de cada fatia, que é a leitura que o
 * desenho dá de graça e o texto precisa escrever.
 */
export function chartTable(
  option: EChartsCoreOption,
  labels: ChartTableLabels = CHART_TABLE_LABELS,
): ChartTable {
  const series = seriesOf(option);

  if (series.length > 0 && series[0].type === 'pie') {
    const slices = Array.isArray(series[0].data) ? (series[0].data as unknown[]) : [];
    const total = slices.reduce<number>(
      (sum, item) => sum + Math.max(0, valueOf(item) ?? 0),
      0,
    );
    return {
      header: [labels.category, labels.value, labels.share],
      rows: slices.map((item, index) => [
        sliceLabelOf(item, index),
        cellOf(item),
        shareOf(valueOf(item) ?? 0, total),
      ]),
    };
  }

  const longest = series.reduce(
    (max, one) => Math.max(max, Array.isArray(one.data) ? one.data.length : 0),
    0,
  );
  const categories = categoriesOf(option, longest);
  return {
    header: [
      labels.category,
      ...series.map((one, index) => {
        if (typeof one.name === 'string' && one.name) return one.name;
        return series.length === 1 ? labels.value : `${labels.value} ${index + 1}`;
      }),
    ],
    rows: categories.map((category, row) => [
      category,
      ...series.map((one) => (Array.isArray(one.data) ? cellOf(one.data[row]) : NO_DATA)),
    ]),
  };
}
