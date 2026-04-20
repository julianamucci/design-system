/**
 * theme-config.ts — Configuração de temas compartilhada entre todos os stacks.
 * Importar via: import { ... } from '@shared/themes/theme-config'
 */

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type ThemeId = 'default' | 'tema-um' | 'tema-dois' | 'tema-tres';

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
    label: 'Nortear (padrão)',
    description: 'Tema neutro em preto e branco',
    cssClass: '',
  },
  {
    id: 'tema-um',
    label: 'Crystal',
    description: 'Indigo/Violet — identidade visual Crystal',
    cssClass: 'tema-um',
  },
  {
    id: 'tema-dois',
    label: 'Dark Industrial',
    description: 'Amber/Slate — tema industrial escuro',
    cssClass: 'tema-dois',
  },
  {
    id: 'tema-tres',
    label: 'Crystal UI',
    description: 'Variante clara do Crystal',
    cssClass: 'tema-tres',
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
  localhost:  'default',
  crystal:    'tema-um',
  nortear:    'default',
  admin:      'tema-dois',
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
