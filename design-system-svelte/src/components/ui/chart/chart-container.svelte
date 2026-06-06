<!--
  ChartContainer Svelte 5 — wrapper de vanilla echarts.
  API: <ChartContainer option={buildBarOption({...})} class="h-64" />
-->
<script lang="ts">
  import { onMount } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { cn } from '@/lib/utils.js';
  import * as echarts from 'echarts/core';
  import { BarChart, LineChart, PieChart } from 'echarts/charts';
  import {
    TitleComponent, TooltipComponent, LegendComponent, GridComponent, DatasetComponent,
  } from 'echarts/components';
  import { SVGRenderer, CanvasRenderer } from 'echarts/renderers';

  echarts.use([
    BarChart, LineChart, PieChart,
    TitleComponent, TooltipComponent, LegendComponent, GridComponent, DatasetComponent,
    SVGRenderer, CanvasRenderer,
  ]);

  const THEME_NAME = 'nortear';

  let {
    option,
    class: className,
    renderer = 'svg',
    'aria-label': ariaLabel = 'Gráfico',
    ...restProps
  }: HTMLAttributes<HTMLDivElement> & {
    option: echarts.EChartsCoreOption;
    class?: string;
    renderer?: 'svg' | 'canvas';
  } = $props();

  let containerEl: HTMLDivElement;

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    echarts.registerTheme(THEME_NAME, buildTheme() as any);
  }

  onMount(() => {
    applyTheme();
    const chart = echarts.init(containerEl, THEME_NAME, { renderer });
    chart.setOption(option);

    const ro = new ResizeObserver(() => chart.resize());
    ro.observe(containerEl);

    const observer = new MutationObserver(() => {
      applyTheme();
      chart.setOption(option, { notMerge: false, lazyUpdate: true });
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => {
      ro.disconnect();
      observer.disconnect();
      chart.dispose();
    };
  });

  $effect(() => {
    if (!containerEl) return;
    const inst = echarts.getInstanceByDom(containerEl);
    inst?.setOption(option, { notMerge: false, lazyUpdate: true });
  });
</script>

<div
  bind:this={containerEl}
  data-slot="chart"
  role="img"
  aria-label={ariaLabel}
  class={cn('w-full', className)}
  style="min-height: 200px;"
  {...restProps}
></div>
