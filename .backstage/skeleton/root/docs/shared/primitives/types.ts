/**
 * types.ts — Tipos TypeScript compartilhados entre todos os stacks.
 * Sem imports de framework — pure TypeScript.
 * Importar via: import type { ... } from '@shared/primitives/types'
 */

// ─── Locale ───────────────────────────────────────────────────────────────────

export type Locale = 'pt-BR' | 'en' | 'es';

export const LOCALES: Locale[] = ['pt-BR', 'en', 'es'];

export const LOCALE_LABELS: Record<Locale, string> = {
  'pt-BR': 'Português',
  en: 'English',
  es: 'Español',
};

export const LOCALE_FLAGS: Record<Locale, string> = {
  'pt-BR': '🇧🇷',
  en: '🇺🇸',
  es: '🇪🇸',
};

// ─── Tamanhos ─────────────────────────────────────────────────────────────────

export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export type ButtonSize = 'sm' | 'default' | 'lg' | 'icon';

// ─── Variantes ────────────────────────────────────────────────────────────────

export type ButtonVariant =
  | 'default'
  | 'destructive'
  | 'outline'
  | 'secondary'
  | 'ghost'
  | 'link';

export type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

export type AlertVariant = 'default' | 'destructive' | 'success' | 'warning' | 'info';

// ─── Status / Estado ──────────────────────────────────────────────────────────

export type Status = 'idle' | 'loading' | 'success' | 'error';

export type ColorScheme = 'light' | 'dark' | 'system';

// ─── Orientação / Posição ────────────────────────────────────────────────────

export type Orientation = 'horizontal' | 'vertical';

export type Side = 'top' | 'right' | 'bottom' | 'left';

export type Align = 'start' | 'center' | 'end';

// ─── Componente base ──────────────────────────────────────────────────────────

/** Props mínimas presentes em todo componente de UI. */
export interface BaseComponentProps {
  id?: string;
  class?: string;
  style?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
}

/** Metadados de um componente do design system (para navegação / docs). */
export interface ComponentMeta {
  id: string;
  label: string;
  description: string;
  group: string;
  status: 'stable' | 'beta' | 'experimental' | 'deprecated';
  since?: string;
}

// ─── Documentação ─────────────────────────────────────────────────────────────

export interface PropDefinition {
  name: string;
  type: string;
  defaultValue?: string;
  required?: boolean;
  description: string;
}

export interface ComponentDocs {
  title: string;
  description: string;
  props?: PropDefinition[];
  events?: Array<{ name: string; payload: string; description: string }>;
  slots?: Array<{ name: string; description: string }>;
}

// ─── Tema ─────────────────────────────────────────────────────────────────────

export type ThemeId = 'default' | 'tema-um' | 'tema-dois' | 'tema-tres';
