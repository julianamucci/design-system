// ─── Chart — wrapper ECharts ─────────────────────────────────────────────────
// Substitui o wrapper anterior baseado em Recharts. API agora é declarativa:
// passa `option` (objeto do echarts) em vez de compor JSX.
//
// Uso:
//   <ChartContainer option={buildBarOption(data)} className="h-64" />
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
} from 'echarts/components';
import { SVGRenderer, CanvasRenderer } from 'echarts/renderers';

import { cn } from '@/lib/utils';

// Bootstrap dos módulos — idempotente, tree-shake friendly.
echarts.use([
  BarChart, LineChart, PieChart,
  TitleComponent, TooltipComponent, LegendComponent, GridComponent, DatasetComponent,
  SVGRenderer, CanvasRenderer,
]);

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
    line: { itemStyle: { borderWidth: 2 }, lineStyle: { width: 2 } },
    bar: { itemStyle: { barBorderColor: card, barBorderWidth: 1 } },
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
    aria: { enabled: true, decal: { show: true } },
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
    aria: { enabled: true, decal: { show: true } },
  };
}

// ─── ChartContainer ──────────────────────────────────────────────────────────

export interface ChartContainerProps extends React.ComponentProps<'div'> {
  option: echarts.EChartsCoreOption;
  renderer?: 'svg' | 'canvas';
}

export function ChartContainer({
  option,
  renderer = 'svg',
  className,
  style,
  ...rest
}: ChartContainerProps) {
  // Re-renderiza quando o tema do <html> muda (tema/dark/densidade/fonte).
  const [themeKey, setThemeKey] = React.useState(0);
  React.useEffect(() => {
    applyTheme();
    const observer = new MutationObserver(() => {
      applyTheme();
      setThemeKey((n) => n + 1);
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

  return (
    <div
      data-slot="chart"
      role="img"
      className={cn('w-full', className)}
      style={{ minHeight: 200, ...style }}
      {...rest}
      aria-label={ariaLabel}
    >
      <ReactECharts
        key={themeKey}
        option={option}
        theme={THEME_NAME}
        opts={{ renderer }}
        style={{ width: '100%', height: '100%' }}
        notMerge={false}
        lazyUpdate
      />
    </div>
  );
}
