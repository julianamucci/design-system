// ─── Card — Vanilla factories alinhadas ao primitive React (shadcn v2) ───────
//
// Visual: classes .nds-card-* (standalone, sem Tailwind/basecoat-css).
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
  el.className = 'nds-card';
  if (className) el.classList.add(...className.split(' ').filter(Boolean));

  return el;
}

export function createCardHeader(options: CardHeaderOptions = {}): HTMLElement {
  const { className } = options;

  const el = document.createElement('div');
  el.setAttribute('data-slot', 'card-header');
  el.className = 'nds-card-header';
  if (className) el.classList.add(...className.split(' ').filter(Boolean));

  return el;
}

export function createCardTitle(options: CardTitleOptions = {}): HTMLElement {
  const { text = '', level = 3, className } = options;

  const el = document.createElement(`h${level}`);
  el.setAttribute('data-slot', 'card-title');
  el.className = 'nds-card-title';
  if (className) el.classList.add(...className.split(' ').filter(Boolean));
  if (text) el.textContent = text;

  return el;
}

export function createCardDescription(options: CardDescriptionOptions = {}): HTMLElement {
  const { text = '', className } = options;

  const el = document.createElement('div');
  el.setAttribute('data-slot', 'card-description');
  el.className = 'nds-card-description';
  if (className) el.classList.add(...className.split(' ').filter(Boolean));
  if (text) el.textContent = text;

  return el;
}

export function createCardAction(options: CardActionOptions = {}): HTMLElement {
  const { className } = options;

  const el = document.createElement('div');
  el.setAttribute('data-slot', 'card-action');
  el.className = 'nds-card-action';
  if (className) el.classList.add(...className.split(' ').filter(Boolean));

  return el;
}

export function createCardContent(options: CardContentOptions = {}): HTMLElement {
  const { className } = options;

  const el = document.createElement('div');
  el.setAttribute('data-slot', 'card-content');
  el.className = 'nds-card-content';
  if (className) el.classList.add(...className.split(' ').filter(Boolean));

  return el;
}

export function createCardFooter(options: CardFooterOptions = {}): HTMLElement {
  const { className } = options;

  const el = document.createElement('div');
  el.setAttribute('data-slot', 'card-footer');
  el.className = 'nds-card-footer';
  if (className) el.classList.add(...className.split(' ').filter(Boolean));

  return el;
}
