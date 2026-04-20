// ─── Card ────────────────────────────────────────────────────────────────────

export interface CardOptions {
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

export interface CardContentOptions {
  className?: string;
}

export interface CardFooterOptions {
  className?: string;
}

export function createCard(options: CardOptions = {}): HTMLElement {
  const { className } = options;

  const el = document.createElement('div');
  el.className = 'card';
  if (className) el.classList.add(...className.split(' ').filter(Boolean));

  return el;
}

export function createCardHeader(options: CardHeaderOptions = {}): HTMLElement {
  const { className } = options;

  const el = document.createElement('div');
  el.className = 'flex flex-col space-y-1.5 p-6';
  if (className) el.classList.add(...className.split(' ').filter(Boolean));

  return el;
}

export function createCardTitle(options: CardTitleOptions = {}): HTMLElement {
  const { text = '', level = 3, className } = options;

  const el = document.createElement(`h${level}`);
  el.className = 'font-semibold leading-none tracking-tight';
  if (className) el.classList.add(...className.split(' ').filter(Boolean));
  if (text) el.textContent = text;

  return el;
}

export function createCardDescription(options: CardDescriptionOptions = {}): HTMLElement {
  const { text = '', className } = options;

  const el = document.createElement('p');
  el.className = 'text-sm text-muted-foreground';
  if (className) el.classList.add(...className.split(' ').filter(Boolean));
  if (text) el.textContent = text;

  return el;
}

export function createCardContent(options: CardContentOptions = {}): HTMLElement {
  const { className } = options;

  const el = document.createElement('div');
  el.className = 'p-6 pt-0';
  if (className) el.classList.add(...className.split(' ').filter(Boolean));

  return el;
}

export function createCardFooter(options: CardFooterOptions = {}): HTMLElement {
  const { className } = options;

  const el = document.createElement('div');
  el.className = 'flex items-center p-6 pt-0';
  if (className) el.classList.add(...className.split(' ').filter(Boolean));

  return el;
}
