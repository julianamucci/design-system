// ─── Vue Chart — barrel ──────────────────────────────────────────────────────
// ChartContainer wrappa vue-echarts com tema Nortear.
// Builders puros pra montar `option` por tipo de chart.

import type { EChartsCoreOption } from 'echarts/core';

export { default as ChartContainer } from './ChartContainer.vue';

export interface ChartDataPoint { label: string; value: number }
export interface ChartSeries { name: string; data: number[]; color?: string }

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
    aria: { enabled: true, decal: { show: true } },
  };
}
