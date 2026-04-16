/**
 * constants.ts — Constantes compartilhadas entre todos os stacks.
 * Sem imports de framework — pure TypeScript.
 * Importar via: import { ... } from '@shared/primitives/constants'
 */

import type { ButtonSize, ButtonVariant, BadgeVariant, AlertVariant, Size } from './types';

// ─── Breakpoints ──────────────────────────────────────────────────────────────

export const BREAKPOINTS = {
  sm:  640,
  md:  768,
  lg:  1024,
  xl:  1280,
  '2xl': 1536,
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

// ─── Button ───────────────────────────────────────────────────────────────────

export const BUTTON_VARIANTS: ButtonVariant[] = [
  'default',
  'destructive',
  'outline',
  'secondary',
  'ghost',
  'link',
];

export const BUTTON_SIZES: ButtonSize[] = ['sm', 'default', 'lg', 'icon'];

// ─── Badge ────────────────────────────────────────────────────────────────────

export const BADGE_VARIANTS: BadgeVariant[] = [
  'default',
  'secondary',
  'destructive',
  'outline',
];

// ─── Alert ────────────────────────────────────────────────────────────────────

export const ALERT_VARIANTS: AlertVariant[] = [
  'default',
  'destructive',
  'success',
  'warning',
  'info',
];

// ─── Tamanhos genéricos ───────────────────────────────────────────────────────

export const SIZES: Size[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];

export const SIZE_LABELS: Record<Size, string> = {
  xs:  'Extra Small',
  sm:  'Small',
  md:  'Medium',
  lg:  'Large',
  xl:  'Extra Large',
  '2xl': '2X Large',
};

// ─── Z-index ──────────────────────────────────────────────────────────────────

export const Z_INDEX = {
  dropdown:      1000,
  sticky:        1020,
  fixed:         1030,
  modalBackdrop: 1040,
  modal:         1050,
  popover:       1060,
  tooltip:       1070,
} as const;

// ─── Animações / Transições ───────────────────────────────────────────────────

export const TRANSITION = {
  fast:   150,
  normal: 300,
  slow:   500,
  timing: 'cubic-bezier(0.4, 0, 0.2, 1)',
} as const;

// ─── Categorias de componentes (para navegação) ───────────────────────────────

export const COMPONENT_GROUPS = [
  'Foundations',
  'Layout',
  'Navigation',
  'Form',
  'Feedback',
  'Display',
  'Overlay',
  'Utilities',
] as const;

export type ComponentGroup = typeof COMPONENT_GROUPS[number];

// ─── Idiomas ──────────────────────────────────────────────────────────────────

export const LOCALE_STORAGE_KEY = 'ds-locale';
export const THEME_STORAGE_KEY  = 'ds-theme';
