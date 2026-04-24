// ─── Card — Vanilla factories alinhadas ao primitive React (shadcn v2) ───────
//
// Paridade com React:
//   - data-slot="card" + data-size={size} no root
//   - rounded-(--radius-card) + bg-card + text-card-foreground + ring-1
//   - group/card — subcomponentes reagem via group-data-[size=sm]/card:*
//   - 7 factories (Card, Header, Title, Description, Action, Content, Footer)
//   - CardFooter detectado via has-[>[data-slot=card-footer]]:pb-0 (CSS do Tailwind, filho direto)
//   - Imagem first/last child com radius + padding automáticos (via classes do Card)

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
  el.className = [
    'group/card',
    'flex flex-col gap-4 overflow-hidden',
    'rounded-(--radius-card)',
    'bg-card text-card-foreground',
    'ring-1 ring-foreground/10',
    'py-4 text-sm',
    // PATCH: bugfix — has-[>[data-slot=card-footer]] restringe a filho direto
    // para não zerar pb em Cards aninhados com footer (ver PATCHES.md#card-footer-direct-child)
    'has-[>[data-slot=card-footer]]:pb-0',
    'has-[>img:first-child]:pt-0',
    'data-[size=sm]:gap-3 data-[size=sm]:py-3',
    'data-[size=sm]:has-[>[data-slot=card-footer]]:pb-0',
    '*:[img:first-child]:rounded-t-(--radius-card)',
    '*:[img:last-child]:rounded-b-(--radius-card)',
  ].join(' ');
  if (className) el.classList.add(...className.split(' ').filter(Boolean));

  return el;
}

export function createCardHeader(options: CardHeaderOptions = {}): HTMLElement {
  const { className } = options;

  const el = document.createElement('div');
  el.setAttribute('data-slot', 'card-header');
  el.className = [
    'group/card-header',
    '@container/card-header',
    'grid auto-rows-min items-start gap-1',
    'rounded-t-(--radius-card)',
    'px-4 group-data-[size=sm]/card:px-3',
    'has-data-[slot=card-action]:grid-cols-[1fr_auto]',
    'has-data-[slot=card-description]:grid-rows-[auto_auto]',
    '[.border-b]:pb-4 group-data-[size=sm]/card:[.border-b]:pb-3',
  ].join(' ');
  if (className) el.classList.add(...className.split(' ').filter(Boolean));

  return el;
}

export function createCardTitle(options: CardTitleOptions = {}): HTMLElement {
  const { text = '', level = 3, className } = options;

  const el = document.createElement(`h${level}`);
  el.setAttribute('data-slot', 'card-title');
  el.className = 'text-base leading-snug font-medium group-data-[size=sm]/card:text-sm';
  if (className) el.classList.add(...className.split(' ').filter(Boolean));
  if (text) el.textContent = text;

  return el;
}

export function createCardDescription(options: CardDescriptionOptions = {}): HTMLElement {
  const { text = '', className } = options;

  const el = document.createElement('div');
  el.setAttribute('data-slot', 'card-description');
  el.className = 'text-sm text-muted-foreground';
  if (className) el.classList.add(...className.split(' ').filter(Boolean));
  if (text) el.textContent = text;

  return el;
}

export function createCardAction(options: CardActionOptions = {}): HTMLElement {
  const { className } = options;

  const el = document.createElement('div');
  el.setAttribute('data-slot', 'card-action');
  el.className = 'col-start-2 row-span-2 row-start-1 self-start justify-self-end';
  if (className) el.classList.add(...className.split(' ').filter(Boolean));

  return el;
}

export function createCardContent(options: CardContentOptions = {}): HTMLElement {
  const { className } = options;

  const el = document.createElement('div');
  el.setAttribute('data-slot', 'card-content');
  el.className = 'px-4 group-data-[size=sm]/card:px-3';
  if (className) el.classList.add(...className.split(' ').filter(Boolean));

  return el;
}

export function createCardFooter(options: CardFooterOptions = {}): HTMLElement {
  const { className } = options;

  const el = document.createElement('div');
  el.setAttribute('data-slot', 'card-footer');
  el.className = [
    'flex items-center',
    'rounded-b-(--radius-card)',
    'border-t bg-muted/50',
    'p-4 group-data-[size=sm]/card:p-3',
  ].join(' ');
  if (className) el.classList.add(...className.split(' ').filter(Boolean));

  return el;
}
