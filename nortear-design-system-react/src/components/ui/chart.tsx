// ─── Chart — wrapper ECharts ─────────────────────────────────────────────────
// Substitui o wrapper anterior baseado em Recharts. API agora é declarativa:
// passa `option` (objeto do echarts) em vez de compor JSX.
//
// Uso:
//   <ChartContainer option={buildBarOption(data)} style={{ height: "16rem" }} />
//
// Para multi-série, customizar tooltip/legenda, etc., construir o `option`
// diretamente. ECharts é declarativo — não há composição JSX como recharts.
//
// ─── Acessibilidade: as quatro decisões ──────────────────────────────────────
//
// 1. ALTERNATIVA TEXTUAL EQUIVALENTE — o container emite, sempre, uma `<table>`
//    de verdade com os mesmos números do desenho: cabeçalho por série,
//    `<th scope="row">` por categoria, `<caption>` com a descrição do gráfico.
//    Por padrão ela é `.nds-sr-only` (existe para leitor de tela e para quem lê
//    o DOM); `showData` a torna visível para todo mundo. Os números saem do
//    PRÓPRIO `option`, e não de um dado paralelo — assim tabela e desenho não
//    têm como divergir.
//
// 2. `role="img"` + `aria-label` vão no elemento do DESENHO, não no bloco
//    `.nds-chart`: o papel poda a subárvore da árvore de acessibilidade, e no
//    bloco a tabela ficaria escondida junto — a alternativa textual sumiria.
//
// 3. A INFORMAÇÃO NÃO VIVE NA COR. `aria.decal.show` sobrepõe uma trama a cada
//    série e a legenda traz o nome escrito. A trama é traçada na cor do FUNDO,
//    e não na da lib — ver `hatchPatterns`, onde está o número que explica por
//    quê. Em linha e área, sem área a hachurar, cada série tem símbolo de ponto
//    próprio (círculo, quadrado, triângulo, losango, seta) e desenho de traço
//    próprio. Retirando toda a cor, o gráfico continua legível (WCAG 1.4.1).
//
// 4. NENHUM TAMANHO DE TEXTO CRAVADO. A lib exige número em pixel, então o
//    número é MEDIDO a partir da fonte raiz e re-medido quando ela muda — o
//    rótulo do eixo cresce com a fonte do navegador (WCAG 1.4.4).

import * as React from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts/core';
import { BarChart, LineChart, PieChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DatasetComponent,
  AriaComponent,
} from 'echarts/components';
import { SVGRenderer, CanvasRenderer } from 'echarts/renderers';

import { cn } from '@/lib/utils';
import { prefersReducedMotion, duration as motionDuration } from '@/lib/motion';

// Bootstrap dos módulos — idempotente, tree-shake friendly.
//
// `AriaComponent` não é enfeite: sem ele o bloco `aria` do option é ignorado em
// silêncio, e a trama sobreposta a cada série — que é o que cumpre a WCAG 1.4.1
// quando a cor sai de cena — nunca chega a ser desenhada. O componente ficou
// meses fora desta lista enquanto a documentação prometia o `decal`.
echarts.use([
  BarChart, LineChart, PieChart,
  TitleComponent, TooltipComponent, LegendComponent, GridComponent, DatasetComponent,
  AriaComponent,
  SVGRenderer, CanvasRenderer,
]);

/**
 * Bloco `aria` comum aos builders.
 *
 * `decal.show` liga a trama por série. `label.enabled: false` desliga a
 * descrição gerada pela lib de propósito: ela nasce em inglês e mora num
 * elemento que o `role="img"` do desenho poda da árvore de acessibilidade —
 * quem carrega a alternativa textual é o `aria-label` autoral, no idioma da
 * página, mais a tabela de dados que o container emite sempre.
 *
 * A COR da trama não entra aqui: ela sai do tema em vigor e é o container quem
 * a pinta, em `withHatchPatterns`. Um construtor puro não pode carregar cor resolvida,
 * porque a cor muda depois — na troca de marca e na troca de claro/escuro.
 */
const ARIA = { enabled: true, label: { enabled: false }, decal: { show: true } } as const;

/**
 * Tramas do decal, uma por posição de série, traçadas na cor recebida.
 *
 * POR QUE RECOLORIR, e o número que impede de "simplificar" isto de volta para
 * a lista da lib: as tramas padrão do ECharts nascem em `rgba(0, 0, 0, 0.2)` —
 * preto a 20% sobre o próprio preenchimento. Medido contra a paleta de gráfico
 * do tema Default, esse desenho se destaca do preenchimento que hachura entre
 * apenas 1.14 e 1.54; no pior caso ninguém o enxerga. A trama é justamente o
 * que mantém o gráfico legível QUANDO A COR SAI DE CENA (WCAG 1.4.1), então uma
 * trama invisível é o critério declarado e não entregue.
 *
 * Traçadas na cor do FUNDO da página, elas herdam a distância que a paleta já
 * tem dele: 7.32 no pior caso no claro e 6.83 no escuro, nos três temas de
 * marca. É por isso que a cor é parâmetro e não constante — o fundo do modo
 * escuro é outro, e uma trama cravada serviria a um modo só.
 *
 * São CINCO desenhos — diagonal ascendente, pontos, diagonal descendente,
 * horizontais, grade — para OITO séries. Da 6ª em diante a lib repete a lista
 * do começo (`paletteIdx = (paletteIdx + 1) % decals.length`), então a 6ª volta
 * à 1ª, a 7ª à 2ª e a 8ª à 3ª. É o mesmo giro de `SYMBOLS` e `DASHES`, e é
 * deliberado: três desenhos novos só entram com uma medida de quanto se
 * distinguem dos cinco atuais, e essa medida ainda não existe. Enquanto não
 * existir, o que separa a 1ª da 6ª é a cor mais a posição na legenda escrita.
 */
function hatchPatterns(color: string): Record<string, unknown>[] {
  return [
    { color, dashArrayX: [1, 0], dashArrayY: [4, 3], rotation: Math.PI / 4 },
    { color, symbol: 'circle', dashArrayX: [[8, 8], [0, 8, 8, 0]], dashArrayY: [6, 0], symbolSize: 0.8 },
    { color, dashArrayX: [1, 0], dashArrayY: [4, 3], rotation: -Math.PI / 4 },
    { color, dashArrayX: [1, 0], dashArrayY: [4, 3], rotation: 0 },
    { color, dashArrayX: [[1, 0], [1, 6]], dashArrayY: [1, 0, 6, 0], rotation: Math.PI / 4 },
  ];
}

/**
 * O mesmo option, com a trama do decal já pintada na cor do fundo em vigor.
 *
 * Mora no container, e não no construtor, porque o construtor roda uma vez e a
 * cor muda depois: `setTheme` relê o REGISTRO do tema, nunca o option, então
 * uma trama resolvida na construção ficaria com o fundo do tema anterior — no
 * escuro, uma hachura quase branca sobre um desenho que já era escuro.
 *
 * Vale também para quem monta o `option` à mão: basta `aria.decal.show`.
 */
function withHatchPatterns(option: echarts.EChartsCoreOption): echarts.EChartsCoreOption {
  const aria = (option as { aria?: { decal?: { show?: boolean } } }).aria;
  if (!aria?.decal?.show) return option;
  return {
    ...option,
    aria: { ...aria, decal: { ...aria.decal, decals: hatchPatterns(hsl('background')) } },
  };
}

/** Frase padrão do estado vazio — a mesma nas cinco stacks. */
export const CHART_EMPTY_LABEL = 'Sem dados para exibir';

/** O option descreve alguma série com dado? Decide o estado vazio. */
export function isChartOptionEmpty(option: echarts.EChartsCoreOption): boolean {
  const series = (option as { series?: unknown }).series;
  const list = Array.isArray(series) ? series : series ? [series] : [];
  if (list.length === 0) return true;
  return list.every((s) => {
    const data = (s as { data?: unknown[] }).data;
    return !Array.isArray(data) || data.length === 0;
  });
}

// ─── Theme (lê tokens do <html>) ─────────────────────────────────────────────

const THEME_NAME = 'nortear';

function hsl(token: string, alpha = 1): string {
  if (typeof document === 'undefined') return 'transparent';
  const raw = getComputedStyle(document.documentElement).getPropertyValue(`--${token}`).trim();
  if (!raw) return 'transparent';
  return alpha === 1 ? `hsl(${raw})` : `hsla(${raw} / ${alpha})`;
}

function cssToken(name: string): string {
  if (typeof document === 'undefined') return '';
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/**
 * Tamanho de fonte raiz, em pixels.
 *
 * Não dá para ler `--text-control` e usar direto: o token é um `calc()`, e
 * `getComputedStyle` de custom property devolve a expressão, não o resultado.
 * O que é mensurável — e o que de fato muda quando a pessoa aumenta a fonte do
 * navegador ou troca a fonte pela barra de ferramentas — é o `font-size`
 * resolvido do `<html>`.
 */
export function rootFontSize(): number {
  if (typeof document === 'undefined') return 16;
  const measured = Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
  return Number.isFinite(measured) && measured > 0 ? measured : 16;
}

/**
 * Degrau tipográfico do desenho, em pixels, relativo à fonte raiz.
 *
 * A lib exige NÚMERO em pixel — não aceita `rem`, `em` nem `var()`. Cravar 14
 * congelava o texto do gráfico: aumentar a fonte do navegador aumentava a
 * página inteira e deixava o rótulo do eixo do mesmo tamanho (WCAG 1.4.4).
 * Como o número é obrigatório, ele é MEDIDO em vez de escolhido, e re-medido
 * sempre que a fonte raiz muda.
 */
function scaled(factor: number): number {
  return Math.round(rootFontSize() * factor);
}

function buildNortearTheme() {
  const fontFamily = cssToken('--font-family-active') || cssToken('--font-family') || 'sans-serif';
  const fg = hsl('foreground');
  const muted = hsl('muted-foreground');
  const card = hsl('card');
  const border = hsl('border');
  // 0.75 = 12px na base 16, o degrau `--text-control-sm`; 0.875 = 14px, o
  // `--text-control`, que é o tamanho do título do desenho.
  const bodySize = scaled(0.75);
  const titleSize = scaled(0.875);
  const axisStyle = {
    axisLine: { show: true, lineStyle: { color: hsl('border', 0.6) } },
    axisTick: { show: true, lineStyle: { color: hsl('border', 0.6) } },
    axisLabel: { show: true, color: muted, fontSize: bodySize },
    splitLine: { show: true, lineStyle: { color: hsl('border', 0.3) } },
    splitArea: { show: false, areaStyle: { color: ['transparent'] } },
  };
  return {
    // Oito séries, e a ORDEM não é arbitrária: cada posição é a cor que mais se
    // afasta em matiz de todas as anteriores. Reordenar não troca "só a cor" —
    // aproxima séries vizinhas e derruba a distância que separa uma da outra.
    // Por isso a lista segue a numeração dos tokens, sem exceção.
    color: [
      hsl('chart-1'), hsl('chart-2'), hsl('chart-3'), hsl('chart-4'),
      hsl('chart-5'), hsl('chart-6'), hsl('chart-7'), hsl('chart-8'),
    ],
    backgroundColor: 'transparent',
    textStyle: { color: fg, fontFamily, fontSize: bodySize },
    title: { textStyle: { color: fg, fontFamily, fontWeight: 600, fontSize: titleSize } },
    legend: { textStyle: { color: muted, fontSize: bodySize } },
    tooltip: {
      backgroundColor: card,
      borderColor: border,
      textStyle: { color: fg, fontSize: bodySize },
    },
    axisPointer: { lineStyle: { color: hsl('primary', 0.5) } },
    categoryAxis: axisStyle,
    valueAxis: axisStyle,
    logAxis: axisStyle,
    timeAxis: axisStyle,
    // WCAG 1.4.11 pede 3:1 do objeto gráfico contra o que está em volta. A
    // paleta antiga tinha de servir à página quase branca E ao fundo quase preto
    // com a mesma cor, e ficava em torno de 2:1 contra o fundo — sozinha não
    // sustentava o critério. Com variante por modo (7.32 no pior caso no claro,
    // 6.83 no escuro), a cor de série já passa. O CONTORNO em --foreground fica
    // assim mesmo, e por outro motivo: é ele que separa duas formas ADJACENTES
    // uma da outra, o que nenhuma medida contra o fundo cobre. O nome anterior
    // (barBorderColor/barBorderWidth) é da v4 do ECharts e não tinha efeito
    // nenhum na v5 — o contorno documentado nunca chegou a ser desenhado.
    line: { itemStyle: { borderColor: fg, borderWidth: 2 }, lineStyle: { width: 2 } },
    bar: { itemStyle: { borderColor: fg, borderWidth: 1 } },
    pie: { itemStyle: { borderColor: fg, borderWidth: 1 } },
  };
}

// Registra/atualiza o tema. Idempotente.
function applyTheme() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  echarts.registerTheme(THEME_NAME, buildNortearTheme() as any);
}

// ─── Option builders ─────────────────────────────────────────────────────────
// Helpers para os 4 tipos cobertos pelas stories. Para mais customização,
// passar `option` direto.

export interface ChartDataPoint { label: string; value: number }
export interface ChartSeries { name: string; data: number[]; color?: string }

/**
 * Símbolo de ponto, na ordem das séries; a 6ª volta à 1ª.
 *
 * A trama do `decal` cobre a metade da WCAG 1.4.1 que vale para forma cheia —
 * barra e fatia. Em linha e área não há área a hachurar: o que resta é o
 * símbolo do ponto e o desenho do traço. Com todos os pontos em círculo, a
 * única pista de qual série é qual era a cor.
 */
const SYMBOLS: readonly string[] = ['circle', 'rect', 'triangle', 'diamond', 'arrow'];

/** Desenho do traço, na ordem das séries. `solid` e quatro tracejados. */
const DASHES: readonly (string | number[])[] = [
  'solid', [10, 5], [2, 4], [12, 4, 2, 4], [6, 3, 2, 3],
];

/**
 * Tamanho do símbolo de ponto, em pixels.
 *
 * Não é enfeite de 6 para 9: em 6px um triângulo e um losango têm a mesma
 * silhueta a olho, e a distinção por forma — que é justamente o que substitui a
 * cor — não chega a existir.
 */
const SYMBOL_SIZE = 9;

/**
 * Nome que o construtor inventa para a série quando o dado vem na forma
 * simples (pares de rótulo e valor). É MARCADOR, não rótulo: na alternativa
 * textual ele dá lugar ao rótulo de valor, que está no idioma da página.
 */
const DEFAULT_SERIES_NAME = 'value';

interface OptionsBase {
  data?: ChartDataPoint[];
  xAxis?: Array<string | number>;
  series?: ChartSeries[];
  title?: string;
  showLegend?: boolean;
}

function buildAxisOption(type: 'bar' | 'line' | 'area', o: OptionsBase): echarts.EChartsCoreOption {
  const xAxisData = o.xAxis ?? o.data?.map((d) => d.label) ?? [];
  const seriesData: ChartSeries[] =
    o.series ?? (o.data ? [{ name: DEFAULT_SERIES_NAME, data: o.data.map((d) => d.value) }] : []);
  const showLegend = o.showLegend ?? seriesData.length > 1;
  return {
    // Sem `textStyle` cravado: o tamanho do título vem do tema, que o mede a
    // partir da fonte raiz. Um `fontSize: 14` aqui venceria a medição e o texto
    // do desenho pararia de crescer com a fonte do navegador.
    title: o.title ? { text: o.title, left: 'left' } : undefined,
    tooltip: { trigger: 'axis', axisPointer: { type: type === 'bar' ? 'shadow' : 'line' } },
    legend: showLegend
      ? { data: seriesData.map((s) => s.name), bottom: 0, icon: 'roundRect', itemWidth: 12, itemHeight: 4 }
      : undefined,
    grid: { left: 16, right: 16, top: o.title ? 48 : 16, bottom: showLegend ? 48 : 24, containLabel: true },
    xAxis: { type: 'category', data: xAxisData, boundaryGap: type === 'bar' },
    yAxis: { type: 'value' },
    series: seriesData.map((s, i) => ({
      name: s.name,
      type: type === 'area' ? 'line' : type,
      data: s.data,
      smooth: type !== 'bar',
      // Símbolo e traço próprios por posição de série: tirando toda a cor, a
      // forma do ponto e o desenho do traço continuam separando as séries.
      symbol: type === 'bar' ? undefined : SYMBOLS[i % SYMBOLS.length],
      symbolSize: SYMBOL_SIZE,
      ...(type === 'bar'
        ? {}
        : { lineStyle: { type: DASHES[i % DASHES.length], ...(s.color ? { color: s.color } : {}) } }),
      ...(s.color ? { itemStyle: { color: s.color } } : {}),
      ...(type === 'area' ? { areaStyle: { opacity: 0.18 } } : {}),
      ...(type === 'bar' ? { itemStyle: { borderRadius: [4, 4, 0, 0], ...(s.color ? { color: s.color } : {}) } } : {}),
    })),
    // Preferência de movimento respeitada com o mesmo helper e os mesmos tokens
    // de duração do resto do design system — o gráfico animava sempre.
    animation: !prefersReducedMotion(),
    animationDuration: Math.round(motionDuration('moderate') * 1000),
    animationEasing: 'cubicOut',
    aria: ARIA,
  };
}

export const buildBarOption  = (o: OptionsBase): echarts.EChartsCoreOption => buildAxisOption('bar',  o);
export const buildLineOption = (o: OptionsBase): echarts.EChartsCoreOption => buildAxisOption('line', o);
export const buildAreaOption = (o: OptionsBase): echarts.EChartsCoreOption => buildAxisOption('area', o);

export function buildPieOption(o: { data: ChartDataPoint[]; title?: string }): echarts.EChartsCoreOption {
  return {
    title: o.title ? { text: o.title, left: 'left', textStyle: { fontSize: 14 } } : undefined,
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 0, icon: 'roundRect', itemWidth: 12, itemHeight: 8 },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['50%', o.title ? '52%' : '45%'],
      avoidLabelOverlap: true,
      itemStyle: { borderRadius: 4 },
      data: o.data.map((p) => ({ name: p.label, value: p.value })),
    }],
    // Preferência de movimento respeitada com o mesmo helper e os mesmos tokens
    // de duração do resto do design system — o gráfico animava sempre.
    animation: !prefersReducedMotion(),
    animationDuration: Math.round(motionDuration('moderate') * 1000),
    aria: ARIA,
  };
}

// ─── Alternativa textual ─────────────────────────────────────────────────────
//
// Um `<svg>` mudo é conteúdo perdido. O que o leitor de tela, a busca do
// navegador e o copiar-e-colar alcançam não é o desenho: é a TABELA — os mesmos
// números, em forma que não depende de enxergar. Ela é emitida sempre, e
// `showData` só decide se ela também aparece para quem enxerga.
//
// A lib não gera nada disso. `aria.label` produz uma frase em inglês dentro de
// um elemento que o próprio `role="img"` poda da árvore; a tabela é do
// componente.

/** Rótulos das colunas que a tabela monta sozinha. */
export interface ChartTableLabels {
  categoryLabel: string;
  valueLabel: string;
  shareLabel: string;
}

/** Cabeçalho e linhas já formatados — a primeira célula de cada linha é o `th`. */
export interface ChartTable {
  header: string[];
  rows: string[][];
}

/** Número curto o bastante para caber numa célula, sem depender de locale. */
export function formatChartValue(value: number): string {
  if (Number.isInteger(value)) return String(value);
  return String(Math.round(value * 100) / 100);
}

type RawSeries = { name?: string; type?: string; data?: unknown[] };

function seriesOf(option: echarts.EChartsCoreOption): RawSeries[] {
  const series = (option as { series?: unknown }).series;
  return (Array.isArray(series) ? series : series ? [series] : []) as RawSeries[];
}

/** O número que a lib desenharia — a entrada aceita número cru ou objeto. */
function numberOf(entry: unknown): number | null {
  const raw = entry !== null && typeof entry === 'object'
    ? (entry as { value?: unknown }).value
    : entry;
  const value = typeof raw === 'string' ? Number(raw) : raw;
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/** Célula de valor. Buraco no dado vira travessão, e não uma célula vazia. */
function cellOf(entry: unknown): string {
  const value = numberOf(entry);
  return value === null ? '—' : formatChartValue(value);
}

function textOf(entry: unknown): string {
  if (entry !== null && typeof entry === 'object') {
    const value = (entry as { value?: unknown }).value;
    return String(value ?? '');
  }
  return String(entry ?? '');
}

/** Categorias do eixo; sem eixo declarado, a posição vira o rótulo. */
function categoriesOf(option: echarts.EChartsCoreOption, count: number): string[] {
  const axis = (option as { xAxis?: unknown }).xAxis;
  const first = (Array.isArray(axis) ? axis[0] : axis) as { data?: unknown[] } | undefined;
  const data = first?.data;
  if (Array.isArray(data) && data.length > 0) return data.map(textOf);
  return Array.from({ length: count }, (_, i) => String(i + 1));
}

/**
 * Os mesmos números do desenho, lidos do próprio option.
 *
 * Ler do option — e não de um dado paralelo passado à parte — é o que garante
 * que a tabela não possa divergir do que está desenhado: as duas saem da mesma
 * fonte. É também o que mantém a API declarativa desta stack intacta.
 */
export function chartTableFromOption(
  option: echarts.EChartsCoreOption,
  labels: ChartTableLabels,
): ChartTable {
  const series = seriesOf(option);

  // A pizza mede parte contra o todo: a coluna de participação é o que a fatia
  // comunica pelo ângulo, e sem ela a tabela contaria menos que o desenho.
  const pie = series.find((s) => s.type === 'pie');
  if (pie) {
    const points = (pie.data ?? []) as unknown[];
    const total = points.reduce<number>((sum, p) => sum + Math.max(0, numberOf(p) ?? 0), 0);
    return {
      header: [labels.categoryLabel, labels.valueLabel, labels.shareLabel],
      rows: points.map((point) => {
        const value = Math.max(0, numberOf(point) ?? 0);
        const name = point !== null && typeof point === 'object'
          ? String((point as { name?: unknown }).name ?? '')
          : '';
        const share = total > 0 ? `${Math.round((value / total) * 1000) / 10}%` : '—';
        return [name, cellOf(point), share];
      }),
    };
  }

  const columns = series.reduce((max, s) => Math.max(max, s.data?.length ?? 0), 0);
  return {
    header: [
      labels.categoryLabel,
      ...series.map((s) => (!s.name || s.name === DEFAULT_SERIES_NAME ? labels.valueLabel : s.name)),
    ],
    rows: categoriesOf(option, columns).map((category, iCategory) => [
      category,
      ...series.map((s) => cellOf(s.data?.[iCategory])),
    ]),
  };
}

// ─── ChartContainer ──────────────────────────────────────────────────────────

export interface ChartContainerProps extends React.ComponentProps<'div'> {
  option: echarts.EChartsCoreOption;
  renderer?: 'svg' | 'canvas';
  /**
   * Altura do DESENHO em pixels.
   *
   * Existe porque a documentação mandava, havia meses, definir a altura por uma
   * classe utilitária de altura fixa do Tailwind — vocabulário que saiu do
   * projeto e não tem efeito nenhum em runtime. A altura é dado do consumidor,
   * então é entrada, não classe; sem valor vale o `min-height` de `.nds-chart`.
   *
   * Vai no elemento em que a lib desenha, e não no bloco: escondida, a tabela
   * de dados não ocupa altura nenhuma e o bloco continua medindo o mesmo; À
   * VISTA, ela cresce por baixo do desenho em vez de ser recortada por uma
   * altura que só o desenho pediu.
   */
  height?: number;
  /** Frase mostrada no lugar do gráfico quando não há série com dado. */
  emptyLabel?: string;
  /**
   * Torna a tabela de dados visível para todo mundo, não só para leitor de
   * tela. A tabela é emitida de qualquer forma — isto decide se ela aparece.
   */
  showData?: boolean;
  /** Cabeçalho da primeira coluna da tabela — a que nomeia cada linha. */
  categoryLabel?: string;
  /** Cabeçalho da coluna de valor quando a série não tem nome próprio. */
  valueLabel?: string;
  /** Cabeçalho da coluna de participação, exclusiva da pizza. */
  shareLabel?: string;
}

export function ChartContainer({
  option,
  renderer = 'svg',
  height,
  emptyLabel = CHART_EMPTY_LABEL,
  showData = false,
  categoryLabel = 'Categoria',
  valueLabel = 'Valor',
  shareLabel = 'Participação',
  className,
  style,
  // Desestruturado, e não deixado no `rest`, porque o rótulo NÃO vai mais no
  // bloco: ele acompanha o `role="img"` até o elemento do desenho.
  'aria-label': ariaLabelProp,
  ...rest
}: ChartContainerProps) {
  // Recolore quando o tema do <html> muda (marca / escuro / densidade / fonte).
  //
  // `registerTheme` só atualiza o REGISTRO global: a instância guarda o tema já
  // resolvido desde o `init`, e nem `setOption` nem uma re-renderização o
  // relêem. O caminho anterior era remontar o gráfico inteiro por uma `key`, o
  // que recolore mas PISCA — e a documentação promete o contrário. `setTheme`
  // relê o registro e repinta no lugar, sem recriar nó nenhum.
  const chartRef = React.useRef<ReactECharts>(null);
  const canvasRef = React.useRef<HTMLDivElement>(null);

  // Contador de troca de tema.
  //
  // O option carrega UMA cor resolvida — a da trama do decal, que sai de
  // `--background` — e `setTheme` relê só o registro do tema, nunca o option.
  // Sem este contador a trama ficaria com o fundo do tema anterior depois da
  // troca, que é o mesmo defeito de sempre num lugar novo.
  const [themeVersion, setThemeVersion] = React.useState(0);

  // Sem série com dado não existe desenho a anunciar: entra a frase, como no
  // Vanilla (referência). O `min-height` de `.nds-chart` segura o bloco, e é
  // por isso que a página não salta quando o dado chega.
  const vazio = isChartOptionEmpty(option);

  // Registra o tema AINDA NA RENDERIZAÇÃO, antes de o filho montar.
  //
  // O registro é global e guarda o último tema calculado. Registrando só no
  // efeito — que roda depois da montagem do filho — o gráfico nasce com a
  // paleta de quem renderizou por último: uma tela clara herdava as cores da
  // tela escura anterior, e o contorno das formas saía a 1.04:1 do fundo. O
  // ciclo é idempotente, então registrar duas vezes não custa nada.
  React.useMemo(() => applyTheme(), []);

  React.useEffect(() => {
    applyTheme();
    const repaint = () => {
      applyTheme();
      chartRef.current?.getEchartsInstance()?.setTheme(THEME_NAME);
      // Repõe a trama na cor do fundo NOVO: `setTheme` não a alcança.
      setThemeVersion((v) => v + 1);
    };
    const observer = new MutationObserver(repaint);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    // Aumentar a fonte do navegador não mexe na classe do documento — mexe na
    // CAIXA. Os degraus tipográficos do desenho saem da fonte raiz medida
    // (WCAG 1.4.4), e sem reler o tema o rótulo do eixo ficaria com o tamanho
    // de antes: a página inteira cresceria e só o gráfico não.
    //
    // A guarda de tamanho de fonte é o que impede o laço: repintar mexe no
    // layout e o layout notifica o observador de novo. Sem ela, cada repintura
    // viraria uma volta a mais.
    let lastFontSize = rootFontSize();
    const resizeObserver = new ResizeObserver(() => {
      const fontSize = rootFontSize();
      if (fontSize === lastFontSize) return;
      lastFontSize = fontSize;
      repaint();
    });
    if (canvasRef.current) resizeObserver.observe(canvasRef.current);

    return () => {
      observer.disconnect();
      resizeObserver.disconnect();
    };
  }, [vazio]);

  // Deriva um aria-label do título do option caso o consumidor não tenha fornecido um.
  const derivedLabel = React.useMemo(() => {
    const t = (option as { title?: { text?: string } | { text?: string }[] }).title;
    if (!t) return undefined;
    if (Array.isArray(t)) return t[0]?.text;
    return t.text;
  }, [option]);
  const ariaLabel = ariaLabelProp ?? derivedLabel ?? 'Gráfico';

  const table = React.useMemo(
    () => chartTableFromOption(option, { categoryLabel, valueLabel, shareLabel }),
    [option, categoryLabel, valueLabel, shareLabel],
  );

  // A trama entra AQUI, e não no construtor: é o container que sabe qual tema
  // está no documento agora. `themeVersion` é dependência de propósito — ela é o
  // único sinal de que o fundo mudou.
  const hatchedOption = React.useMemo(
    () => withHatchPatterns(option),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [option, themeVersion],
  );

  return (
    <div data-slot="chart" className={cn('nds-chart', className)} style={style} {...rest}>
      {vazio ? (
        // Sem `role="img"` aqui de propósito: o papel PODA a subárvore da
        // árvore de acessibilidade, e a frase que explica a ausência de dado é
        // justamente o conteúdo — ficaria escondida atrás de um rótulo
        // genérico.
        <p className="nds-chart-empty">{emptyLabel}</p>
      ) : (
        <>
          {/* O elemento em que a lib desenha. É ele — e não o bloco em volta —
              que leva o papel de imagem e o rótulo, porque `role="img"` poda a
              subárvore: no bloco, a tabela de dados ficaria escondida junto e a
              alternativa textual sumiria. Aqui o desenho é anunciado como uma
              imagem com rótulo e a tabela continua exposta, ao lado. */}
          <div
            ref={canvasRef}
            data-slot="chart-canvas"
            role="img"
            aria-label={ariaLabel}
            style={{ width: '100%', height: height === undefined ? '100%' : height }}
          >
            <ReactECharts
              ref={chartRef}
              option={hatchedOption}
              theme={THEME_NAME}
              opts={{ renderer }}
              style={{ width: '100%', height: '100%' }}
              notMerge={false}
              lazyUpdate
            />
          </div>

          {/* Alternativa textual equivalente. Não é enfeite: é o mesmo dado, em
              forma que leitor de tela, busca e cópia alcançam.

              A caixa que rola só existe quando a tabela está À VISTA, e aí ela
              é alcançável por teclado — como no primitivo Table. Fora da tela a
              tabela mede 1px, então o overflow automático a tornaria uma região
              rolável sem foco (scrollable-region-focusable), sem nada para
              rolar: colunas que só existem para quem usa mouse, num elemento
              que ninguém enxerga. */}
          <div
            data-slot="chart-data"
            className={showData ? 'nds-table-wrapper' : 'nds-sr-only'}
            tabIndex={showData ? 0 : undefined}
          >
            <table className="nds-table">
              <caption>{ariaLabel}</caption>
              <thead>
                <tr>
                  {table.header.map((column, iColumn) => (
                    <th key={`${column}-${iColumn}`} scope="col">{column}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row, iRow) => (
                  <tr key={`${row[0]}-${iRow}`}>
                    <th scope="row">{row[0]}</th>
                    {row.slice(1).map((cell, iCell) => (
                      <td key={iCell}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
