// Dados de exemplo e utilitários de medição do Chart.
//
// Vive fora de `*.stories.ts` porque ali TODO export nomeado vira story: uma
// constante de dados exportada apareceria na sidebar como uma story quebrada.
//
// O bloco de contraste existe porque a exigência do gráfico é numérica
// (WCAG 1.4.11 pede 3:1) e "olhar e achar bonito" não a verifica. As play
// functions resolvem o token no navegador e medem.

import type { ChartDataPoint, ChartSeries } from './chart';

// ─── Dados ────────────────────────────────────────────────────────────────────

export const MONTHS: string[] = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];

export const SERIE_UNICA: ChartSeries[] = [
  { name: 'Desktop', data: [186, 305, 237, 73, 209, 214] },
];

export const SERIES_MULTI: ChartSeries[] = [
  { name: 'Desktop', data: [186, 305, 237, 73, 209, 214] },
  { name: 'Mobile', data: [80, 200, 120, 190, 130, 140] },
];

export const SERIES_TRIO: ChartSeries[] = [
  ...SERIES_MULTI,
  { name: 'Tablet', data: [40, 60, 55, 48, 70, 66] },
];

export const DATA_DISPOSITIVO: ChartDataPoint[] = [
  { label: 'Desktop', value: 1224 },
  { label: 'Mobile', value: 860 },
  { label: 'Tablet', value: 320 },
];

/** Uma série curta, para o mini gráfico ao lado de um número. */
export const TENDENCIA: ChartSeries[] = [
  { name: 'Acessos', data: [120, 160, 140, 190, 210, 260] },
];

// ─── Contraste ────────────────────────────────────────────────────────────────

type RGB = [number, number, number];

/** `rgb(r, g, b)` / `rgba(...)` como o navegador devolve em computed style. */
export function rgbColor(css: string): RGB | null {
  const nums = css.match(/[\d.]+/g);
  if (!nums || nums.length < 3) return null;
  return [Number(nums[0]) / 255, Number(nums[1]) / 255, Number(nums[2]) / 255];
}

function luminancia([r, g, b]: RGB): number {
  const canal = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
}

/** Razão de contraste WCAG entre duas cores já em RGB 0..1. */
export function contrastRatio(a: RGB, b: RGB): number {
  const la = luminancia(a);
  const lb = luminancia(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/**
 * Resolve um token de cor do design system, no tema ativo, para RGB.
 *
 * Os tokens guardam os três componentes de HSL soltos (`199 89% 65%`) para que
 * o CSS possa compor `hsl(var(--x) / 0.5)`. Lê o valor bruto e converte — sem
 * criar elemento de sonda, que exigiria escrever estilo inline.
 */
export function rgbToken(token: string, insideOf: Element = document.documentElement): RGB | null {
  const bruto = getComputedStyle(insideOf).getPropertyValue(token).trim();
  const nums = bruto.match(/-?[\d.]+/g);
  if (!nums || nums.length < 3) return null;
  return rgbHsl(Number(nums[0]), Number(nums[1]), Number(nums[2]));
}

function rgbHsl(h: number, s: number, l: number): RGB {
  const sat = s / 100;
  const luz = l / 100;
  const a = sat * Math.min(luz, 1 - luz);
  const canal = (n: number) => {
    const k = (n + h / 30) % 12;
    return luz - a * Math.max(-1, Math.min(Math.min(k - 3, 9 - k), 1));
  };
  return [canal(0), canal(8), canal(4)];
}
