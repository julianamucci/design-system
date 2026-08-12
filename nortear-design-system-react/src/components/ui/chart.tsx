// ─── Chart — wrapper ECharts ─────────────────────────────────────────────────
// Substitui o wrapper anterior baseado em Recharts. API agora é declarativa:
// passa `option` (objeto do echarts) em vez de compor JSX.
//
// Uso:
//   <ChartContainer option={buildBarOption(data)} style={{ height: "16rem" }} />
//
// Para multi-série, customizar tooltip/legenda, etc., construir o `option`
// diretamente. ECharts é declarativo — não há composição JSX como recharts.

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
 * elemento interno que o `role="img"` do container poda da árvore de
 * acessibilidade — quem carrega a alternativa textual é o `aria-label`
 * autoral do container, que está no idioma da página.
 */
const ARIA = { enabled: true, label: { enabled: false }, decal: { show: true } } as const;

/** Frase padrão do estado vazio — a mesma nas cinco stacks. */
export const CHART_EMPTY_LABEL = 'Sem dados para exibir';

/** O option descreve alguma série com dado? Decide o estado vazio. */
export function isChartOptionEmpty(option: echarts.EChartsCoreOption): boolean {
  const series = (option as { series?: unknown }).series;
  const lista = Array.isArray(series) ? series : series ? [series] : [];
  if (lista.length === 0) return true;
  return lista.every((s) => {
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

function buildNortearTheme() {
  const fontFamily = cssToken('--font-family-active') || cssToken('--font-family') || 'sans-serif';
  const fg = hsl('foreground');
  const muted = hsl('muted-foreground');
  const card = hsl('card');
  const border = hsl('border');
  const axisStyle = {
    axisLine: { show: true, lineStyle: { color: hsl('border', 0.6) } },
    axisTick: { show: true, lineStyle: { color: hsl('border', 0.6) } },
    axisLabel: { show: true, color: muted },
    splitLine: { show: true, lineStyle: { color: hsl('border', 0.3) } },
    splitArea: { show: false, areaStyle: { color: ['transparent'] } },
  };
  return {
    color: [hsl('chart-1'), hsl('chart-2'), hsl('chart-3'), hsl('chart-4'), hsl('chart-5')],
    backgroundColor: 'transparent',
    textStyle: { color: fg, fontFamily },
    title: { textStyle: { color: fg, fontFamily, fontWeight: 600 } },
    legend: { textStyle: { color: muted } },
    tooltip: { backgroundColor: card, borderColor: border, textStyle: { color: fg } },
    axisPointer: { lineStyle: { color: hsl('primary', 0.5) } },
    categoryAxis: axisStyle,
    valueAxis: axisStyle,
    logAxis: axisStyle,
    timeAxis: axisStyle,
    // WCAG 1.4.11 pede 3:1 do objeto gráfico contra o que está em volta, e as
    // cores de série (--chart-1 a --chart-5) ficam em torno de 2:1 contra o fundo:
    // sozinhas não sustentam o critério. Quem sustenta é o CONTORNO em
    // --foreground, o mesmo caminho que o Angular desenha à mão. O nome anterior
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
    o.series ?? (o.data ? [{ name: 'value', data: o.data.map((d) => d.value) }] : []);
  const showLegend = o.showLegend ?? seriesData.length > 1;
  return {
    title: o.title ? { text: o.title, left: 'left', textStyle: { fontSize: 14 } } : undefined,
    tooltip: { trigger: 'axis', axisPointer: { type: type === 'bar' ? 'shadow' : 'line' } },
    legend: showLegend
      ? { data: seriesData.map((s) => s.name), bottom: 0, icon: 'roundRect', itemWidth: 12, itemHeight: 4 }
      : undefined,
    grid: { left: 16, right: 16, top: o.title ? 48 : 16, bottom: showLegend ? 48 : 24, containLabel: true },
    xAxis: { type: 'category', data: xAxisData, boundaryGap: type === 'bar' },
    yAxis: { type: 'value' },
    series: seriesData.map((s) => ({
      name: s.name,
      type: type === 'area' ? 'line' : type,
      data: s.data,
      smooth: type !== 'bar',
      symbol: type === 'bar' ? undefined : 'circle',
      symbolSize: 6,
      ...(s.color ? { itemStyle: { color: s.color }, lineStyle: { color: s.color } } : {}),
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

// ─── ChartContainer ──────────────────────────────────────────────────────────

export interface ChartContainerProps extends React.ComponentProps<'div'> {
  option: echarts.EChartsCoreOption;
  renderer?: 'svg' | 'canvas';
  /**
   * Altura do container em pixels.
   *
   * Existe porque a documentação mandava, havia meses, definir a altura por uma
   * classe utilitária de altura fixa do Tailwind — vocabulário que saiu do
   * projeto e não tem efeito nenhum em runtime. A altura é dado do consumidor,
   * então é entrada, não classe; sem valor vale o `min-height` de `.nds-chart`.
   */
  height?: number;
  /** Frase mostrada no lugar do gráfico quando não há série com dado. */
  emptyLabel?: string;
}

export function ChartContainer({
  option,
  renderer = 'svg',
  height,
  emptyLabel = CHART_EMPTY_LABEL,
  className,
  style,
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
    const observer = new MutationObserver(() => {
      applyTheme();
      chartRef.current?.getEchartsInstance()?.setTheme(THEME_NAME);
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Deriva um aria-label do título do option caso o consumidor não tenha fornecido um.
  const derivedLabel = React.useMemo(() => {
    const t = (option as { title?: { text?: string } | { text?: string }[] }).title;
    if (!t) return undefined;
    if (Array.isArray(t)) return t[0]?.text;
    return t.text;
  }, [option]);
  const ariaLabel =
    (rest as { 'aria-label'?: string })['aria-label'] ?? derivedLabel ?? 'Gráfico';

  // Sem série com dado não existe desenho a anunciar: entra a frase, como no
  // Vanilla (referência) e no Angular. O `min-height` de `.nds-chart` segura o
  // bloco, e é por isso que a página não salta quando o dado chega.
  const vazio = isChartOptionEmpty(option);

  return (
    <div
      data-slot="chart"
      // `role="img"` PODA a subárvore da árvore de acessibilidade. Com desenho
      // isso é o que se quer: o `aria-label` substitui um SVG que o leitor de
      // tela não teria como narrar. No estado vazio seria o contrário — a frase
      // que explica a ausência de dado é justamente o conteúdo, e ficaria
      // escondida atrás de um rótulo genérico. Sem papel, ela é lida.
      role={vazio ? undefined : 'img'}
      className={cn('nds-chart', className)}
      style={height === undefined ? style : { height, ...style }}
      {...rest}
      aria-label={vazio ? undefined : ariaLabel}
    >
      {vazio ? (
        <p className="nds-chart-empty">{emptyLabel}</p>
      ) : (
        <ReactECharts
          ref={chartRef}
          option={option}
          theme={THEME_NAME}
          opts={{ renderer }}
          style={{ width: '100%', height: '100%' }}
          notMerge={false}
          lazyUpdate
        />
      )}
    </div>
  );
}
