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
 * A lib de gráfico só aceita NÚMERO em pixel para tamanho de texto — não existe
 * `em`, não existe `rem`, não existe token. Número escolhido à mão fica surdo
 * ao navegador: o tema não declarava `fontSize` nenhum, então valia o padrão da
 * lib (12) para rótulo, legenda e dica, e o option cravava 14 no título.
 * Nenhum dos dois crescia quando a pessoa aumentava a fonte do navegador,
 * enquanto a frase do estado vazio — que é CSS — crescia ao lado, no mesmo
 * componente. Em 200% o desenho ficava com o texto do tamanho de 100% (WCAG
 * 1.4.4).
 *
 * Não dá para ler `--text-control` e usar direto: o token é um `calc()`, e
 * `getComputedStyle` de custom property devolve a expressão, não o resultado. O
 * que é mensurável — e o que de fato muda quando a fonte do navegador muda ou a
 * barra de ferramentas troca a família — é o `font-size` resolvido do `<html>`.
 * Daí o número sai medido, não escolhido.
 */
export function rootFontSize(): number {
  if (typeof document === 'undefined') return 16;
  const medida = Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
  return Number.isFinite(medida) && medida > 0 ? medida : 16;
}

/** Degrau tipográfico do desenho, em pixels, relativo à fonte raiz. */
function scaled(fator: number): number {
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
  // `--text-control`. São exatamente os números que estavam cravados antes —
  // o que muda é que agora eles acompanham a fonte raiz em vez de ignorá-la.
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
    // vizinhas e devolve ao desenho o problema que a ordem resolve. A paleta
    // também tem variante por modo: a mesma cor não servia à página quase
    // branca e ao fundo quase preto, e no escuro uma das séries chegava a
    // medir 1.00 contra o fundo — invisível. Medido agora, o pior caso é 7.32
    // no claro e 6.83 no escuro, nos três temas de marca.
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
    // WCAG 1.4.11 pede 3:1 do objeto gráfico contra o que está em volta, e o
    // CONTORNO em --foreground é quem entrega isso: passa de 3:1 em qualquer
    // tema, qualquer que seja a cor de série. Ele nasceu quando a paleta ficava
    // em torno de 2:1 contra o fundo; hoje ela mede 7.32 no pior caso claro e
    // 6.83 no escuro e sustentaria o critério sozinha, mas o contorno continua
    // porque a medida contra o FUNDO não diz nada sobre a fronteira entre duas
    // formas VIZINHAS — barras encostadas, fatias adjacentes —, e é essa
    // fronteira que o traço delimita. O nome anterior
    // (barBorderColor/barBorderWidth) é da v4 do ECharts e não tinha efeito
    // nenhum na v5 — o contorno documentado nunca chegou a ser desenhado.
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
