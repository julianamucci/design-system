/**
 * theme-config.ts — Configuração de temas compartilhada entre todos os stacks.
 * Importar via: import { ... } from '@shared/themes/theme-config'
 *
 * Default é o tema padrão e carrega as cores da marca Nortear. Warm e Cold são variantes de cor.
 */

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type ThemeId = 'default' | 'warm' | 'cold';

export interface ThemeDefinition {
  id: ThemeId;
  label: string;
  description: string;
  cssClass: string;
}

// ─── Catálogo de temas ────────────────────────────────────────────────────────

export const themes: ThemeDefinition[] = [
  {
    id: 'default',
    label: 'Default',
    description: 'Cores da marca Nortear — teal, areia e Ink · tema padrão',
    // `tema-default`, e não string vazia. Enquanto o Default era ausência de
    // classe, os 39 tokens de cor dele precisavam viver em `:root` — e viviam
    // ali E em `default.css`, os mesmos valores em dois lugares mantidos iguais
    // à mão. Divergiram. Agora cada tema tem um lugar só, e o preço é que a
    // classe passou a ser obrigatória: sem ela não há cor.
    cssClass: 'tema-default',
  },
  {
    id: 'warm',
    label: 'Warm',
    description: 'Cores quentes — tint âmbar nos neutros, marca vermelha e status fora do semáforo',
    cssClass: 'tema-warm',
  },
  {
    id: 'cold',
    label: 'Cold',
    description: 'Cores frias — tint azul nos neutros, paleta cyan/teal',
    cssClass: 'tema-cold',
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
// O PRIMEIRO rótulo do hostname decide o tema (warm.norteardesign.com.br → warm;
// warm.react.norteardesign.com.br → warm). Subdomínios de stack e hosts
// institucionais caem no Default. Consumido pelos preview.ts das 4 stacks
// (defaultValue do global `brand`) — a toolbar continua permitindo troca manual.

export const subdomainThemeMap: Record<string, ThemeId> = {
  // temas de marca
  warm: 'warm',
  cold: 'cold',
  // stacks e hosts institucionais → tema padrão
  localhost: 'default',
  nortear:   'default',
  admin:     'default',
  react:     'default',
  vue:       'default',
  svelte:    'default',
  vanilla:   'default',
};

// ─── Domínios de produção ─────────────────────────────────────────────────────

const PRODUCTION_DOMAINS = ['norteardesign.com.br', 'nortear.com.br', 'design-system.dev'];

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
  return subdomainThemeMap[sub] ?? 'default';
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
