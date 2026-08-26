// ─── Vue Chart — barrel ──────────────────────────────────────────────────────
// ChartContainer wrappa vue-echarts com tema Nortear.
// Builders puros pra montar `option` por tipo de chart.

import type { EChartsCoreOption } from 'echarts/core';
import { ARIA, CHART_TABLE_LABELS } from './chart-state';
import { prefersReducedMotion, duration as motionDuration } from '@/lib/motion';

export { default as ChartContainer } from './ChartContainer.vue';
export { CHART_EMPTY_LABEL, isChartOptionEmpty } from './chart-state';

export interface ChartDataPoint { label: string; value: number }
export interface ChartSeries { name: string; data: number[]; color?: string }

// ─── Vocabulário do desenho ──────────────────────────────────────────────────
//
// A trama do `decal` cumpre a WCAG 1.4.1 onde há ÁREA para tramar — barra e
// fatia. A linha não tem área: uma série vira um traço de um pixel e meio, e a
// trama não chega nela. O que resta ali é a forma do ponto e o desenho do
// traço, e sem os dois duas séries só se distinguem pela cor.

/** Símbolo de ponto, na ordem das séries; o 6º volta ao 1º. */
const CHART_SYMBOLS: readonly string[] = ['circle', 'rect', 'triangle', 'diamond', 'arrow'];

/** Desenho do traço, na ordem das séries. `solid` e quatro tracejados. */
const CHART_LINE_DASHES: readonly (string | number[])[] = [
  'solid', [10, 5], [2, 4], [12, 4, 2, 4], [6, 3, 2, 3],
];

interface OptionsBase {
  data?: ChartDataPoint[];
  xAxis?: Array<string | number>;
  series?: ChartSeries[];
  title?: string;
  showLegend?: boolean;
}

function buildAxisOption(type: 'bar' | 'line' | 'area', o: OptionsBase): EChartsCoreOption {
  const xAxisData = o.xAxis ?? o.data?.map((d) => d.label) ?? [];
  const seriesData: ChartSeries[] =
    o.series ?? (o.data ? [{ name: CHART_TABLE_LABELS.value, data: o.data.map((d) => d.value) }] : []);
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
    series: seriesData.map((s, i) => ({
      name: s.name,
      type: type === 'area' ? 'line' : type,
      data: s.data,
      smooth: type !== 'bar',
      ...(type === 'bar'
        ? {}
        : {
          // Símbolo e traço próprios por série: a forma distingue sem a cor.
          symbol: CHART_SYMBOLS[i % CHART_SYMBOLS.length],
          symbolSize: 9,
          lineStyle: {
            type: CHART_LINE_DASHES[i % CHART_LINE_DASHES.length],
            ...(s.color ? { color: s.color } : {}),
          },
        }),
      ...(type === 'area' ? { areaStyle: { opacity: 0.18 } } : {}),
      ...(s.color || type === 'bar'
        ? {
          itemStyle: {
            ...(s.color ? { color: s.color } : {}),
            ...(type === 'bar' ? { borderRadius: [4, 4, 0, 0] } : {}),
          },
        }
        : {}),
    })),
    // Preferência de movimento respeitada com o mesmo helper e os mesmos tokens
    // de duração do resto do design system — o gráfico animava sempre.
    animation: !prefersReducedMotion(),
    animationDuration: Math.round(motionDuration('moderate') * 1000),
    animationEasing: 'cubicOut',
    aria: ARIA,
  };
}

export const buildBarOption  = (o: OptionsBase): EChartsCoreOption => buildAxisOption('bar',  o);
export const buildLineOption = (o: OptionsBase): EChartsCoreOption => buildAxisOption('line', o);
export const buildAreaOption = (o: OptionsBase): EChartsCoreOption => buildAxisOption('area', o);

export function buildPieOption(o: { data: ChartDataPoint[]; title?: string }): EChartsCoreOption {
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
