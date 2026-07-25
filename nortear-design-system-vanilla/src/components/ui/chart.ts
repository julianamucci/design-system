// ─── Chart — ECharts factory ─────────────────────────────────────────────────
// Container responsivo wrappando Apache ECharts. Suporta bar / line / area / pie.
//
// API (mantém shape próximo ao anterior pra compat com stories):
//   createChart({ type, data, height, ... }) → HTMLElement
//
// O elemento retornado pode ser appendado ao DOM normalmente. Init do echarts
// é deferida até o container estar conectado (Storybook anexa em seguida).
//
// Para uso avançado (multi-série, customização full do option), passar
// `series` em vez de `data`.

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

import { THEME_NAME, registerNortearTheme, watchTheme } from '@/lib/echarts-theme';
import { prefersReducedMotion, duration as motionDuration } from '@/lib/motion';

// Bootstrap dos módulos — idempotente. Tree-shake friendly.
echarts.use([
  BarChart, LineChart, PieChart,
  TitleComponent, TooltipComponent, LegendComponent, GridComponent, DatasetComponent,
  SVGRenderer, CanvasRenderer,
]);

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type ChartType = 'bar' | 'line' | 'area' | 'pie';

/** Forma simples: 1 série, label + value (compat com stories antigas). */
export interface ChartDataPoint {
  label: string;
  value: number;
}

/** Forma multi-série: x-axis + N séries com array de valores. */
export interface ChartSeries {
  name: string;
  data: number[];
  /** Cor explícita (sobrescreve token --chart-{n}). */
  color?: string;
}

export interface ChartOptions {
  type?: ChartType;
  /** Dataset simples (1 série). Use `series` p/ multi-série. */
  data?: ChartDataPoint[];
  /** Multi-série: labels do eixo X. */
  xAxis?: Array<string | number>;
  /** Multi-série: séries com dados alinhados ao xAxis. */
  series?: ChartSeries[];
  /** Altura em px do container. Default 200. */
  height?: number;
  /** Renderer. Default 'svg' (alinha com o resto da stack standalone). */
  renderer?: 'svg' | 'canvas';
  /** Título opcional acima do chart. */
  title?: string;
  /** Mostrar legenda (default: true se >1 série). */
  showLegend?: boolean;
  /** Classe extra no container. */
  class?: string;
}

export interface ChartHandle {
  update: (opts: ChartOptions) => void;
  resize: () => void;
  destroy: () => void;
  el: HTMLElement;
}

// ─── Option builder (puro) ───────────────────────────────────────────────────

export function buildChartOption(opts: ChartOptions): echarts.EChartsCoreOption {
  const type = opts.type ?? 'bar';

  // Normaliza dado simples → xAxis + 1 série.
  const xAxisData =
    opts.xAxis ?? opts.data?.map((d) => d.label) ?? [];
  const seriesData: ChartSeries[] =
    opts.series ??
    (opts.data ? [{ name: 'value', data: opts.data.map((d) => d.value) }] : []);

  const showLegend = opts.showLegend ?? seriesData.length > 1;

  // Pie tem shape diferente — xAxis/yAxis vão fora.
  if (type === 'pie') {
    const points = opts.data ?? [];
    return {
      title: opts.title ? { text: opts.title, left: 'left', textStyle: { fontSize: 14 } } : undefined,
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: showLegend || points.length > 0
        ? { bottom: 0, icon: 'roundRect', itemWidth: 12, itemHeight: 8 }
        : undefined,
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', opts.title ? '52%' : '45%'],
        avoidLabelOverlap: true,
        itemStyle: { borderRadius: 4 },
        data: points.map((p) => ({ name: p.label, value: p.value })),
      }],
      animation: !prefersReducedMotion(),
      animationDuration: Math.round(motionDuration('moderate') * 1000),
      aria: { enabled: true, decal: { show: true } },
    };
  }

  // bar / line / area — eixo cartesiano.
  return {
    title: opts.title ? { text: opts.title, left: 'left', textStyle: { fontSize: 14 } } : undefined,
    tooltip: { trigger: 'axis', axisPointer: { type: type === 'bar' ? 'shadow' : 'line' } },
    legend: showLegend ? {
      data: seriesData.map((s) => s.name),
      bottom: 0,
      icon: 'roundRect',
      itemWidth: 12,
      itemHeight: 4,
    } : undefined,
    grid: {
      left: 16, right: 16,
      top: opts.title ? 48 : 16,
      bottom: showLegend ? 48 : 24,
      containLabel: true,
    },
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
    animation: !prefersReducedMotion(),
    animationDuration: Math.round(motionDuration('moderate') * 1000),
    animationEasing: 'cubicOut',
    aria: { enabled: true, decal: { show: true } },
  };
}

// ─── Factory ──────────────────────────────────────────────────────────────────

/**
 * Cria o container + handle. Init do echarts é deferida até o elemento estar
 * conectado ao DOM (Storybook anexa em seguida do return).
 */
export function createChart(opts: ChartOptions = {}): HTMLElement {
  const el = document.createElement('div');
  el.dataset.slot = 'chart';
  el.className = ['nds-chart', opts.class].filter(Boolean).join(' ');
  el.style.width = '100%';
  el.style.height = `${opts.height ?? 200}px`;

  // Estado vazio — sem dados, mostra mensagem em vez de chart.
  const isEmpty =
    (!opts.data || opts.data.length === 0) &&
    (!opts.series || opts.series.length === 0);
  if (isEmpty) {
    const empty = document.createElement('p');
    empty.className = 'nds-chart-empty';
    empty.textContent = 'Sem dados para exibir';
    el.appendChild(empty);
    return el;
  }

  // Init deferida — espera el estar conectado pra echarts.init() funcionar.
  const mountWhenReady = (cb: () => void) => {
    if (el.isConnected) { cb(); return; }
    const obs = new MutationObserver(() => {
      if (el.isConnected) { obs.disconnect(); cb(); }
    });
    obs.observe(document.body, { childList: true, subtree: true });
  };

  mountWhenReady(() => {
    registerNortearTheme();
    const chart = echarts.init(el, THEME_NAME, { renderer: opts.renderer ?? 'svg' });
    chart.setOption(buildChartOption(opts));

    const ro = new ResizeObserver(() => chart.resize());
    ro.observe(el);

    const unwatch = watchTheme(() => {
      registerNortearTheme();
      chart.setOption(buildChartOption(opts), { notMerge: false, lazyUpdate: true });
    });

    (el as HTMLElement & { __chartCleanup?: () => void }).__chartCleanup = () => {
      ro.disconnect();
      unwatch();
      chart.dispose();
    };
  });

  return el;
}

/**
 * Versão com handle explícito — pra controle de update/destroy fora do Storybook.
 * Espera container já mountado.
 */
export function createChartWithHandle(container: HTMLElement, opts: ChartOptions = {}): ChartHandle {
  registerNortearTheme();
  const chart = echarts.init(container, THEME_NAME, { renderer: opts.renderer ?? 'svg' });
  let currentOpts = opts;
  chart.setOption(buildChartOption(opts));

  const ro = new ResizeObserver(() => chart.resize());
  ro.observe(container);

  const unwatch = watchTheme(() => {
    registerNortearTheme();
    chart.setOption(buildChartOption(currentOpts), { notMerge: false, lazyUpdate: true });
  });

  return {
    el: container,
    update: (newOpts) => {
      currentOpts = { ...currentOpts, ...newOpts };
      chart.setOption(buildChartOption(currentOpts), { notMerge: false });
    },
    resize: () => chart.resize(),
    destroy: () => {
      ro.disconnect();
      unwatch();
      chart.dispose();
    },
  };
}
