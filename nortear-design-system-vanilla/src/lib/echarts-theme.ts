// ─── ECharts theme builder ────────────────────────────────────────────────────
// Bridge entre tokens CSS do Nortear e o sistema de tema do ECharts.
//
// Responsabilidades:
//   1. buildNortearTheme()      → JSON do tema lido dos tokens resolvidos no <html>.
//   2. registerNortearTheme()   → registra o tema no echarts core.
//   3. watchTheme(callback)     → MutationObserver no <html> dispara callback
//      quando classe muda (tema/dark/densidade/fonte) — consumer re-aplica.

import * as echarts from 'echarts/core';

// ─── Tipo do tema ─────────────────────────────────────────────────────────────

export interface NortearChartTheme {
  color: string[];
  backgroundColor: string;
  textStyle: { color: string; fontFamily: string };
  title: { textStyle: { color: string; fontFamily: string; fontWeight: number } };
  legend: { textStyle: { color: string } };
  tooltip: {
    backgroundColor: string;
    borderColor: string;
    textStyle: { color: string };
  };
  axisPointer: { lineStyle: { color: string } };
  categoryAxis: ChartAxisStyle;
  valueAxis: ChartAxisStyle;
  logAxis: ChartAxisStyle;
  timeAxis: ChartAxisStyle;
  line: { itemStyle: { borderWidth: number }; lineStyle: { width: number } };
  bar: { itemStyle: { barBorderColor: string; barBorderWidth: number } };
}

interface ChartAxisStyle {
  axisLine: { show: boolean; lineStyle: { color: string } };
  axisTick: { show: boolean; lineStyle: { color: string } };
  axisLabel: { show: boolean; color: string };
  splitLine: { show: boolean; lineStyle: { color: string[] | string } };
  splitArea: { show: boolean; areaStyle: { color: string[] } };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Lê token HSL e devolve cor CSS válida (alpha=1 → hsl, alpha<1 → hsla). */
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

// ─── Theme builder ────────────────────────────────────────────────────────────

export function buildNortearTheme(): NortearChartTheme {
  const fontFamily =
    cssToken('--font-family-active') || cssToken('--font-family') || 'sans-serif';
  const fg = hsl('foreground');
  const muted = hsl('muted-foreground');
  const border = hsl('border');
  const card = hsl('card');

  const axisStyle: ChartAxisStyle = {
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

// ─── Theme registration ───────────────────────────────────────────────────────

export const THEME_NAME = 'nortear';

/** Registra/sobrescreve o tema no echarts. Idempotente. */
export function registerNortearTheme(): void {
  // O cast é necessário porque o tipo público do registerTheme do echarts é
  // `Record<string, unknown>` (eles documentam o shape mas não exportam tipo).
  echarts.registerTheme(THEME_NAME, buildNortearTheme() as unknown as Record<string, unknown>);
}

// ─── Theme observer ───────────────────────────────────────────────────────────

/**
 * Observa mudanças na classe do <html> e dispara callback. Cleanup via return.
 */
export function watchTheme(callback: () => void): () => void {
  if (typeof document === 'undefined') return () => {};
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  });
  return () => observer.disconnect();
}
