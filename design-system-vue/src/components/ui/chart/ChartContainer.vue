<!--
  ChartContainer — wrapper de vue-echarts. Substitui o wrapper anterior
  baseado em @unovis/vue. API agora é declarativa: `<ChartContainer :option="..." />`.
-->
<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref, useAttrs } from 'vue';
import VChart from 'vue-echarts';
import * as echarts from 'echarts/core';
import { BarChart, LineChart, PieChart } from 'echarts/charts';
import {
  TitleComponent, TooltipComponent, LegendComponent, GridComponent, DatasetComponent,
} from 'echarts/components';
import { SVGRenderer, CanvasRenderer } from 'echarts/renderers';
import { cn } from '@/lib/utils';
import type { HTMLAttributes } from 'vue';

echarts.use([
  BarChart, LineChart, PieChart,
  TitleComponent, TooltipComponent, LegendComponent, GridComponent, DatasetComponent,
  SVGRenderer, CanvasRenderer,
]);

const props = defineProps<{
  option: echarts.EChartsCoreOption;
  class?: HTMLAttributes['class'];
  renderer?: 'svg' | 'canvas';
}>();

const themeName = 'nortear';
const themeKey = ref(0);

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

function buildTheme() {
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

function applyTheme() {
  echarts.registerTheme(themeName, buildTheme() as Record<string, unknown>);
}

let observer: MutationObserver | null = null;
onMounted(() => {
  applyTheme();
  observer = new MutationObserver(() => {
    applyTheme();
    themeKey.value++;
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
});
onBeforeUnmount(() => observer?.disconnect());

const containerClass = computed(() => cn('w-full', props.class));
const rendererName = computed(() => props.renderer ?? 'svg');

const attrs = useAttrs();
const accessibleLabel = computed(
  () => (attrs['aria-label'] as string | undefined) ?? (attrs['aria-labelledby'] as string | undefined),
);
const containerRole = computed(() => (accessibleLabel.value ? 'img' : undefined));
</script>

<template>
  <div data-slot="chart" :role="containerRole" :class="containerClass" :style="{ minHeight: '200px' }">
    <VChart
      :key="themeKey"
      :option="option"
      :theme="themeName"
      :init-options="{ renderer: rendererName }"
      autoresize
      style="width: 100%; height: 100%;"
    />
  </div>
</template>
