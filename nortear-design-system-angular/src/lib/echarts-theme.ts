// ─── ECharts theme builder ────────────────────────────────────────────────────
// Bridge entre tokens CSS do Nortear e o sistema de tema do ECharts.
//
// Responsabilidades:
//   1. buildNortearTheme()      → JSON do tema lido dos tokens resolvidos no <html>.
//   2. registerNortearTheme()   → registra o tema no echarts core.
//   3. watchTheme(callback)     → MutationObserver no <html> dispara callback
//      quando classe muda (tema/dark/densidade/fonte) — consumer re-aplica.
//
// Os tamanhos de texto NÃO são números cravados: nascem do tamanho de fonte
// RAIZ resolvido, porque o componente que este tema serve prometia, desde o
// desenho em SVG à mão, que "aumentar a fonte do navegador aumenta o rótulo do
// eixo junto" (WCAG 1.4.4). O ECharts exige número em pixel — então o número é
// medido, não escolhido.

import * as echarts from 'echarts/core';

// ─── Tipo do tema ─────────────────────────────────────────────────────────────

export interface NortearChartTheme {
  color: string[];
  backgroundColor: string;
  textStyle: { color: string; fontFamily: string; fontSize: number };
  title: { textStyle: { color: string; fontFamily: string; fontWeight: number; fontSize: number } };
  legend: { textStyle: { color: string; fontSize: number } };
  tooltip: {
    backgroundColor: string;
    borderColor: string;
    textStyle: { color: string; fontSize: number };
  };
  axisPointer: { lineStyle: { color: string } };
  categoryAxis: ChartAxisStyle;
  valueAxis: ChartAxisStyle;
  logAxis: ChartAxisStyle;
  timeAxis: ChartAxisStyle;
  line: { itemStyle: { borderColor: string; borderWidth: number }; lineStyle: { width: number } };
  bar: { itemStyle: { borderColor: string; borderWidth: number } };
  pie: { itemStyle: { borderColor: string; borderWidth: number } };
}

interface ChartAxisStyle {
  axisLine: { show: boolean; lineStyle: { color: string } };
  axisTick: { show: boolean; lineStyle: { color: string } };
  axisLabel: { show: boolean; color: string; fontSize: number };
  splitLine: { show: boolean; lineStyle: { color: string[] | string } };
  splitArea: { show: boolean; areaStyle: { color: string[] } };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Lê token HSL e devolve cor CSS válida (alpha=1 → hsl, alpha<1 → hsla). */
export function hsl(token: string, alpha = 1): string {
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
 * Não dá para ler `--text-control` e usar direto: o token é um `calc()` e
 * `getComputedStyle` de custom property devolve a expressão, não o resultado.
 * O que é mensurável — e o que de fato muda quando a pessoa aumenta a fonte do
 * navegador ou troca a fonte pela barra de ferramentas — é o `font-size`
 * resolvido do `<html>`.
 */
export function rootFontSize(): number {
  if (typeof document === 'undefined') return 16;
  const medida = Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
  return Number.isFinite(medida) && medida > 0 ? medida : 16;
}

/**
 * Degrau tipográfico do desenho, em pixels, relativo à fonte raiz.
 *
 * Exportado porque o espaço que o desenho reserva para título e legenda é
 * medido no MESMO degrau do texto que vai ali dentro: cravar 48px reserva
 * espaço para a fonte de hoje e corta o rótulo quando a pessoa aumenta a do
 * navegador (WCAG 1.4.4). Quem precisa de pixel pede o degrau, não o número.
 */
export function scaled(fator: number): number {
  return Math.round(rootFontSize() * fator);
}

// ─── Theme builder ────────────────────────────────────────────────────────────

export function buildNortearTheme(): NortearChartTheme {
  const fontFamily =
    cssToken('--font-family-active') || cssToken('--font-family') || 'sans-serif';
  const fg = hsl('foreground');
  const muted = hsl('muted-foreground');
  const border = hsl('border');
  const card = hsl('card');

  // 0.75 = 12px na base 16, o degrau `--text-control-sm`; 0.875 = 14px, o
  // `--text-control`, que é o tamanho do título.
  const bodySize = scaled(0.75);
  const titleSize = scaled(0.875);

  const axisStyle: ChartAxisStyle = {
    axisLine: { show: true, lineStyle: { color: hsl('border', 0.6) } },
    axisTick: { show: true, lineStyle: { color: hsl('border', 0.6) } },
    axisLabel: { show: true, color: muted, fontSize: bodySize },
    splitLine: { show: true, lineStyle: { color: hsl('border', 0.3) } },
    splitArea: { show: false, areaStyle: { color: ['transparent'] } },
  };

  return {
    // Oito séries, e a ORDEM não é decorativa: cada posição é a cor que mais se
    // afasta em matiz das anteriores — a menor separação é de 38° dentro das
    // cinco primeiras e de 20° dentro das oito. Reordenar aproxima matizes
    // vizinhas e devolve ao desenho o problema que a ordem resolve.
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
    // WCAG 1.4.11 pede 3:1 do objeto gráfico contra o que está em volta, e quem
    // sustenta isso é o CONTORNO em --foreground, que passa de 3:1 em qualquer
    // tema. Ele nasceu quando as cores de série iam de 2.07 a 13.23 no claro e
    // de 1.00 a 6.41 no escuro — uma delas ERA o fundo, com contraste 1.00, e
    // sumia. Com a paleta por modo o pior caso passou a 7.32 no claro e 6.83 no
    // escuro, nos três temas, e a cor sozinha já sustentaria o critério; o
    // contorno fica porque a medida contra o FUNDO não diz nada sobre a
    // fronteira entre duas formas VIZINHAS — barras encostadas, fatias
    // adjacentes —, e é essa fronteira que o traço delimita. É o mesmo contorno
    // que o desenho em SVG à mão traçava, e o motivo de ele existir não mudou
    // com a troca de motor.
    line: { itemStyle: { borderColor: fg, borderWidth: 2 }, lineStyle: { width: 2 } },
    bar: { itemStyle: { borderColor: fg, borderWidth: 1 } },
    pie: { itemStyle: { borderColor: fg, borderWidth: 1 } },
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
