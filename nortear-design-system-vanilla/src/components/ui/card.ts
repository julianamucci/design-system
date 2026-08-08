import { cn } from '@/lib/utils';
// ─── Card — Vanilla factories alinhadas ao primitive React  ───────
//
// Visual: classes .nds-card-* (standalone .nds-*).
// Comportamentos preservados:
//   - data-size={size} no root → propaga padding/font dos subcomponentes via CSS
//   - has-[> .nds-card-footer]:padding-bottom 0 (CSS, filho direto)
//   - has-[> img:first-child]:padding-top 0
//   - Cantos arredondados em imagem first/last automáticos

// ─── Types ───────────────────────────────────────────────────────────────────

export type CardSize = 'default' | 'sm';

export interface CardOptions {
  /** Tamanho do Card. Propaga via data-size e afeta padding/font dos subcomponentes. */
  size?: CardSize;
  /** Additional CSS classes to append. */
  className?: string;
}

export interface CardHeaderOptions {
  className?: string;
}

export interface CardTitleOptions {
  text?: string;
  /** Heading level rendered (default: 3). */
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  className?: string;
}

export interface CardDescriptionOptions {
  text?: string;
  className?: string;
}

export interface CardActionOptions {
  className?: string;
}

export interface CardContentOptions {
  className?: string;
}

export interface CardFooterOptions {
  className?: string;
}

// ─── Factories ───────────────────────────────────────────────────────────────

export function createCard(options: CardOptions = {}): HTMLElement {
  const { size = 'default', className } = options;

  const el = document.createElement('div');
  el.setAttribute('data-slot', 'card');
  el.setAttribute('data-size', size);
  el.className = cn('nds-card', className);

  return el;
}

export function createCardHeader(options: CardHeaderOptions = {}): HTMLElement {
  const { className } = options;

  const el = document.createElement('div');
  el.setAttribute('data-slot', 'card-header');
  el.className = cn('nds-card-header', className);

  return el;
}

export function createCardTitle(options: CardTitleOptions = {}): HTMLElement {
  const { text = '', level = 3, className } = options;

  const el = document.createElement(`h${level}`);
  el.setAttribute('data-slot', 'card-title');
  el.className = cn('nds-card-title', className);
  if (text) el.textContent = text;

  return el;
}

export function createCardDescription(options: CardDescriptionOptions = {}): HTMLElement {
  const { text = '', className } = options;

  const el = document.createElement('div');
  el.setAttribute('data-slot', 'card-description');
  el.className = cn('nds-card-description', className);
  if (text) el.textContent = text;

  return el;
}

export function createCardAction(options: CardActionOptions = {}): HTMLElement {
  const { className } = options;

  const el = document.createElement('div');
  el.setAttribute('data-slot', 'card-action');
  el.className = cn('nds-card-action', className);

  return el;
}

export function createCardContent(options: CardContentOptions = {}): HTMLElement {
  const { className } = options;

  const el = document.createElement('div');
  el.setAttribute('data-slot', 'card-content');
  el.className = cn('nds-card-content', className);

  return el;
}

export function createCardFooter(options: CardFooterOptions = {}): HTMLElement {
  const { className } = options;

  const el = document.createElement('div');
  el.setAttribute('data-slot', 'card-footer');
  el.className = cn('nds-card-footer', className);

  return el;
}
