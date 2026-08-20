import { cn } from '@/lib/utils';
// ─── Card — Vanilla factories alinhadas ao primitive React  ───────
//
// Visual: classes .nds-card-* (standalone .nds-*).
// Comportamentos preservados:
//   - data-size={size} no root → propaga padding/font dos subcomponentes via CSS
//   - has-[> .nds-card-footer]:padding-bottom 0 (CSS, filho direto)
//   - has-[> img:first-child]:padding-top 0
//   - Cantos arredondados em imagem first/last automáticos

// ─── `class`, e `className` como apelido ─────────────────────────────────────
//
// Dez das treze fábricas desta stack chamam a opção de `class`; card, label e
// breadcrumb chamavam de `className`, herança do primitivo React de onde
// nasceram. Nome diferente para a mesma coisa é dívida, não sotaque: quem
// escreve `class:` num Card e vê a classe sumir não descobre o motivo lendo o
// call site.
//
// `className` continua aceito — apagá-lo quebraria chamador em silêncio, e o
// tipo já marca qual dos dois é o nome. Quando os dois vêm, `class` vence.

// ─── Types ───────────────────────────────────────────────────────────────────

export type CardSize = 'default' | 'sm';

export interface CardOptions {
  /** Tamanho do Card. Propaga via data-size e afeta padding/font dos subcomponentes. */
  size?: CardSize;
  /** Additional CSS classes to append. */
  class?: string;
  /** @deprecated Apelido de `class`. */
  className?: string;
}

export interface CardHeaderOptions {
  class?: string;
  /** @deprecated Apelido de `class`. */
  className?: string;
}

export interface CardTitleOptions {
  text?: string;
  /** Heading level rendered (default: 3). */
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  class?: string;
  /** @deprecated Apelido de `class`. */
  className?: string;
}

export interface CardDescriptionOptions {
  text?: string;
  class?: string;
  /** @deprecated Apelido de `class`. */
  className?: string;
}

export interface CardActionOptions {
  class?: string;
  /** @deprecated Apelido de `class`. */
  className?: string;
}

export interface CardContentOptions {
  class?: string;
  /** @deprecated Apelido de `class`. */
  className?: string;
}

export interface CardFooterOptions {
  class?: string;
  /** @deprecated Apelido de `class`. */
  className?: string;
}

// ─── Factories ───────────────────────────────────────────────────────────────

export function createCard(options: CardOptions = {}): HTMLElement {
  const { size = 'default' } = options;
  const classe = options.class ?? options.className;

  const el = document.createElement('div');
  el.setAttribute('data-slot', 'card');
  el.setAttribute('data-size', size);
  el.className = cn('nds-card', classe);

  return el;
}

export function createCardHeader(options: CardHeaderOptions = {}): HTMLElement {
  const classe = options.class ?? options.className;

  const el = document.createElement('div');
  el.setAttribute('data-slot', 'card-header');
  el.className = cn('nds-card-header', classe);

  return el;
}

export function createCardTitle(options: CardTitleOptions = {}): HTMLElement {
  const { text = '', level = 3 } = options;
  const classe = options.class ?? options.className;

  const el = document.createElement(`h${level}`);
  el.setAttribute('data-slot', 'card-title');
  el.className = cn('nds-card-title', classe);
  if (text) el.textContent = text;

  return el;
}

export function createCardDescription(options: CardDescriptionOptions = {}): HTMLElement {
  const { text = '' } = options;
  const classe = options.class ?? options.className;

  const el = document.createElement('div');
  el.setAttribute('data-slot', 'card-description');
  el.className = cn('nds-card-description', classe);
  if (text) el.textContent = text;

  return el;
}

export function createCardAction(options: CardActionOptions = {}): HTMLElement {
  const classe = options.class ?? options.className;

  const el = document.createElement('div');
  el.setAttribute('data-slot', 'card-action');
  el.className = cn('nds-card-action', classe);

  return el;
}

export function createCardContent(options: CardContentOptions = {}): HTMLElement {
  const classe = options.class ?? options.className;

  const el = document.createElement('div');
  el.setAttribute('data-slot', 'card-content');
  el.className = cn('nds-card-content', classe);

  return el;
}

export function createCardFooter(options: CardFooterOptions = {}): HTMLElement {
  const classe = options.class ?? options.className;

  const el = document.createElement('div');
  el.setAttribute('data-slot', 'card-footer');
  el.className = cn('nds-card-footer', classe);

  return el;
}
