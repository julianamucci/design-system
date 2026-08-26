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
 *
 * O que NÃO está aqui é o desenho da trama: ele sai de `chartDecals()` e entra
 * pelo TEMA, montado pelo container. O motivo é a cor — a trama é traçada no
 * fundo da página, e fundo é valor de tema. No option ela ficaria congelada na
 * cor do tema em que o desenho nasceu; no tema, `setTheme` a recolore junto com
 * a paleta, sem remontar nada.
 */
export const ARIA = { enabled: true, label: { enabled: false }, decal: { show: true } } as const;

/**
 * Tramas do decal, uma por posição de série, traçadas em `color`.
 *
 * A lista PADRÃO da lib não serve, e o motivo é medido: as tramas dela nascem
 * em `rgba(0, 0, 0, 0.2)` — preto a 20% por cima do próprio preenchimento —, e
 * contra a paleta de gráfico do tema Default isso separa a hachura do
 * preenchimento entre 1.14 e 1.54. No pior caso, imperceptível: a trama é o que
 * faz o gráfico continuar legível SEM cor (WCAG 1.4.1), e declarada sem ser
 * enxergada ela não cumpre nada.
 *
 * O traço sai do FUNDO da página, que é a única cor que separa a hachura do
 * preenchimento em qualquer tema — a trama passa a se destacar do preenchimento
 * exatamente tanto quanto a série se destaca do fundo: 7.32 no pior caso claro
 * e 6.83 no escuro, nos três temas.
 *
 * CINCO desenhos para OITO séries. Da sexta em diante a lista recomeça, porque
 * a lib cicla a paleta de trama como cicla a de cor: a sexta série repete o
 * desenho da primeira, e o que volta a separá-las é a cor. É o mesmo teto que
 * os cinco símbolos de ponto e os cinco desenhos de traço já tinham. Não se
 * inventou um sexto desenho aqui de propósito — desenho de trama se MEDE (a
 * densidade e a orientação precisam continuar distinguíveis lado a lado, em
 * mais de um tamanho de fonte), e além da quinta série a leitura sem cor se
 * apoia na legenda escrita e na tabela de dados, que nomeiam cada série.
 *
 * Mora aqui, e não junto dos símbolos e traços do barrel, porque quem a chama é
 * o CONTAINER: o barrel exporta o próprio componente, e importar de lá fecharia
 * um ciclo.
 */
export function chartDecals(color: string): Record<string, unknown>[] {
  return [
    // diagonal ascendente
    { color, dashArrayX: [1, 0], dashArrayY: [4, 3], rotation: Math.PI / 4 },
    // pontos
    { color, symbol: 'circle', dashArrayX: [[8, 8], [0, 8, 8, 0]], dashArrayY: [6, 0], symbolSize: 0.8 },
    // diagonal descendente
    { color, dashArrayX: [1, 0], dashArrayY: [4, 3], rotation: -Math.PI / 4 },
    // horizontais
    { color, dashArrayX: [1, 0], dashArrayY: [4, 3], rotation: 0 },
    // grade
    { color, dashArrayX: [[1, 0], [1, 6]], dashArrayY: [1, 0, 6, 0], rotation: Math.PI / 4 },
  ];
}

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

/**
 * Nome de uma parte nomeada — fatia da pizza, etapa do funil. Sem nome escrito,
 * a posição é o que resta de rótulo.
 */
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

/**
 * Participação de um valor sobre a REFERÊNCIA da leitura, com uma casa.
 *
 * A conta é a mesma; a referência muda com o tipo, e quem a escolhe é o
 * desenho. Na pizza a fatia é parte de um TOTAL — o círculo inteiro está na
 * tela, e é contra ele que a área de cada fatia se lê. No funil não há total à
 * vista: o que está na tela é a largura de cada faixa comparada à da PRIMEIRA
 * etapa, e é essa razão que a coluna precisa escrever. `—` quando a referência
 * não é positiva, que é onde a divisão deixaria de significar alguma coisa.
 */
function shareOf(value: number, reference: number): string {
  if (reference <= 0) return NO_DATA;
  return `${Math.round((Math.max(0, value) / reference) * 1000) / 10}%`;
}

/**
 * Os números do desenho em forma de tabela: uma coluna por série, uma linha por
 * categoria — e, na pizza e no funil, a participação de cada parte, que é a
 * leitura que o desenho dá de graça e o texto precisa escrever.
 */
export function chartTable(
  option: EChartsCoreOption,
  labels: ChartTableLabels = CHART_TABLE_LABELS,
): ChartTable {
  const series = seriesOf(option);

  // O funil não tem eixo: cada linha é uma etapa, na ordem do processo, e a
  // terceira coluna é a participação em relação à PRIMEIRA etapa.
  //
  // Existe pelo mesmo motivo da participação da pizza: o que o desenho comunica
  // aqui é a LARGURA da faixa, e largura não se lê em texto. A correspondência é
  // exata — o montador fixa `min: 0` e a faixa vai de `minSize` a `maxSize`
  // sobre a maior etapa, então a largura de cada faixa dividida pela da primeira
  // é o número desta coluna.
  if (series.length > 0 && series[0].type === 'funnel') {
    const stages = Array.isArray(series[0].data) ? (series[0].data as unknown[]) : [];
    // A entrada do processo é a primeira ETAPA, não a maior: reordenar por valor
    // trocaria qual etapa serve de referência, e o funil descreve um percurso,
    // não um ranking. É a mesma razão de `sort: 'none'` no desenho.
    const entry = valueOf(stages[0]) ?? 0;
    return {
      header: [labels.category, labels.value, labels.share],
      rows: stages.map((item, index) => [
        sliceLabelOf(item, index),
        cellOf(item),
        shareOf(valueOf(item) ?? 0, entry),
      ]),
    };
  }

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
