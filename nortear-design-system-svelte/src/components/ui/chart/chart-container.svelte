<!--
  ChartContainer Svelte 5 — wrapper de vanilla echarts.
  API: <ChartContainer option={buildBarOption({...})} style="height: 16rem" />
-->
<script lang="ts">
  import { onMount } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { cn } from '@/lib/utils.js';
  import * as echarts from 'echarts/core';
  import { BarChart, LineChart, PieChart } from 'echarts/charts';
  import {
    TitleComponent, TooltipComponent, LegendComponent, GridComponent, DatasetComponent,
    AriaComponent,
  } from 'echarts/components';
  import { SVGRenderer, CanvasRenderer } from 'echarts/renderers';
  import { CHART_EMPTY_LABEL, isChartOptionEmpty } from './chart-state.js';

  // `AriaComponent` não é enfeite: sem ele o bloco `aria` do option é ignorado
  // em silêncio, e a trama sobreposta a cada série — que é o que cumpre a WCAG
  // 1.4.1 quando a cor sai de cena — nunca chega a ser desenhada.
  echarts.use([
    BarChart, LineChart, PieChart,
    TitleComponent, TooltipComponent, LegendComponent, GridComponent, DatasetComponent,
    AriaComponent,
    SVGRenderer, CanvasRenderer,
  ]);

  const THEME_NAME = 'nortear';

  let {
    option,
    class: className,
    renderer = 'svg',
    height,
    emptyLabel = CHART_EMPTY_LABEL,
    'aria-label': ariaLabel = 'Gráfico',
    ...restProps
  }: HTMLAttributes<HTMLDivElement> & {
    option: echarts.EChartsCoreOption;
    class?: string;
    renderer?: 'svg' | 'canvas';
    /**
     * Altura do container em pixels. Existe porque a documentação mandava
     * definir a altura por uma classe utilitária de altura fixa do Tailwind —
     * vocabulário que saiu do projeto e não tem efeito em runtime. Sem valor
     * vale o `min-height` de `.nds-chart`.
     */
    height?: number;
    /** Frase mostrada no lugar do gráfico quando não há série com dado. */
    emptyLabel?: string;
  } = $props();

  let containerEl: HTMLDivElement | undefined = $state();

  // Sem série com dado não existe desenho a anunciar: entra a frase, como no
  // Vanilla (referência) e no Angular.
  const vazio = $derived(isChartOptionEmpty(option));

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

  function applyTheme() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    echarts.registerTheme(THEME_NAME, buildTheme() as any);
  }

  onMount(() => {
    if (!containerEl || vazio) return;
    applyTheme();
    const chart = echarts.init(containerEl, THEME_NAME, { renderer });
    chart.setOption(option);

    const ro = new ResizeObserver(() => chart.resize());
    ro.observe(containerEl);

    const observer = new MutationObserver(() => {
      applyTheme();
      // `registerTheme` só atualiza o REGISTRO global. A instância guarda o
      // tema já resolvido desde o `init`, e `setOption` sem `notMerge`
      // reaproveita esse model — trocar a classe do documento não mudava cor
      // nenhuma do desenho, e no tema escuro o gráfico ficava com a paleta
      // clara. Quem relê o registro é `setTheme`, e ele recolore no lugar, sem
      // remontar: é o "não pisca nem requer reload" que a documentação promete.
      chart.setTheme(THEME_NAME);
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

{#if vazio}
  <!--
    Sem `role="img"` de propósito: o papel PODA a subárvore da árvore de
    acessibilidade, e aqui a frase que explica a ausência de dado é justamente o
    conteúdo — ficaria escondida atrás de um rótulo genérico. Sem papel, ela é
    lida. (E `aria-label` num <div> sem papel é atributo proibido.)
  -->
  <div
    data-slot="chart"
    class={cn('nds-chart', className)}
    style={height === undefined ? undefined : `height: ${height}px`}
    {...restProps}
  >
    <p class="nds-chart-empty">{emptyLabel}</p>
  </div>
{:else}
  <div
    bind:this={containerEl}
    data-slot="chart"
    role="img"
    aria-label={ariaLabel}
    class={cn('nds-chart', className)}
    style={height === undefined ? undefined : `height: ${height}px`}
    {...restProps}
  ></div>
{/if}
