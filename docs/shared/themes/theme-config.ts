/**
 * theme-config.ts — Configuração de temas compartilhada entre todos os stacks.
 * Importar via: import { ... } from '@shared/themes/theme-config'
 *
 * Temas espelham os 7 styles do shadcn (Nova, Vega, Maia, Lyra, Mira, Luma, Sera).
 * Todos usam Base Color: Neutral, Theme Color: Neutral, Chart Color: Neutral.
 * O que varia entre temas: radius, dimensões (--height-*, --size-*) e shadows.
 */

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type ThemeId = 'nova' | 'vega' | 'maia' | 'lyra' | 'mira' | 'luma' | 'sera';

export interface ThemeDefinition {
  id: ThemeId;
  label: string;
  description: string;
  cssClass: string;
}

// ─── Catálogo de temas ────────────────────────────────────────────────────────

export const themes: ThemeDefinition[] = [
  {
    id: 'nova',
    label: 'Nova',
    description: 'Moderno, compacto, cantos suaves — tema padrão',
    cssClass: '',
  },
  {
    id: 'vega',
    label: 'Vega',
    description: 'Clássico, rounded-md, densidade folgada, shadows pronunciados',
    cssClass: 'tema-vega',
  },
  {
    id: 'maia',
    label: 'Maia',
    description: 'Pill-shaped, friendly, shadows soft e difusas',
    cssClass: 'tema-maia',
  },
  {
    id: 'lyra',
    label: 'Lyra',
    description: 'Brutalista, cantos retos, hard-offset shadows',
    cssClass: 'tema-lyra',
  },
  {
    id: 'mira',
    label: 'Mira',
    description: 'Minimalista, ultra-compacto, shadows sutis',
    cssClass: 'tema-mira',
  },
  {
    id: 'luma',
    label: 'Luma',
    description: 'Elegante, rounded-xl, shadows frias e soft',
    cssClass: 'tema-luma',
  },
  {
    id: 'sera',
    label: 'Sera',
    description: 'Editorial, cantos retos, shadows warm-toned',
    cssClass: 'tema-sera',
  },
];

/** Map id → label (para selects, dropdowns, etc.) */
export const themeDisplayNames: Record<ThemeId, string> = Object.fromEntries(
  themes.map((t) => [t.id, t.label])
) as Record<ThemeId, string>;

/** Map id → cssClass */
export const themeCssClasses: Record<ThemeId, string> = Object.fromEntries(
  themes.map((t) => [t.id, t.cssClass])
) as Record<ThemeId, string>;

// ─── Subdomínio → tema ────────────────────────────────────────────────────────

export const subdomainThemeMap: Record<string, ThemeId> = {
  localhost: 'nova',
  nortear:   'nova',
  admin:     'lyra',
};

// ─── Domínios de produção ─────────────────────────────────────────────────────

const PRODUCTION_DOMAINS = ['nortear.com.br', 'design-system.dev'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getCurrentSubdomain(): string {
  if (typeof window === 'undefined') return 'localhost';
  const { hostname } = window.location;
  if (hostname === 'localhost' || hostname === '127.0.0.1') return 'localhost';
  const parts = hostname.split('.');
  return parts.length >= 2 ? parts[0] : 'localhost';
}

export function getThemeFromSubdomain(): ThemeId {
  const sub = getCurrentSubdomain();
  return subdomainThemeMap[sub] ?? 'nova';
}

export function isDevMode(): boolean {
  if (typeof window === 'undefined') return true;
  const { hostname } = window.location;
  if (['localhost', '127.0.0.1', ''].includes(hostname)) return true;
  if (hostname.includes('figma.com')) return true;
  return !PRODUCTION_DOMAINS.some((d) => hostname.endsWith(d));
}

export function getThemeInfo() {
  const subdomain = getCurrentSubdomain();
  const theme = getThemeFromSubdomain();
  const devMode = isDevMode();
  return {
    subdomain,
    theme,
    isDevMode: devMode,
    allowManualSelection:
      devMode || new URLSearchParams(window.location.search).has('theme-selector'),
  };
}

/** Aplica um tema no <html> removendo o anterior. */
export function applyTheme(themeId: ThemeId, isDark: boolean): void {
  const root = document.documentElement;
  // Remove todas as classes de tema
  themes.forEach((t) => { if (t.cssClass) root.classList.remove(t.cssClass); });
  root.classList.remove('dark');
  // Aplica nova
  const cssClass = themeCssClasses[themeId];
  if (cssClass) root.classList.add(cssClass);
  if (isDark) root.classList.add('dark');
}
