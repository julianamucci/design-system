// ─── Breadcrumb ──────────────────────────────────────────────────────────────

export interface BreadcrumbOptions {
  /** Accessible label for the nav landmark (default: "breadcrumb"). */
  label?: string;
  className?: string;
}

export interface BreadcrumbListOptions {
  className?: string;
}

export interface BreadcrumbItemOptions {
  className?: string;
}

export interface BreadcrumbLinkOptions {
  href: string;
  text?: string;
  className?: string;
}

export interface BreadcrumbPageOptions {
  text?: string;
  className?: string;
}

export interface BreadcrumbSeparatorOptions {
  /** Custom separator content; defaults to the › character. */
  content?: string | HTMLElement;
  className?: string;
}

export interface BreadcrumbEllipsisOptions {
  /** Accessible label for the ellipsis button (default: "More pages"). */
  label?: string;
  className?: string;
}

export function createBreadcrumb(options: BreadcrumbOptions = {}): HTMLElement {
  const { label = 'breadcrumb', className } = options;

  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', label);
  nav.className = '';
  if (className) nav.classList.add(...className.split(' ').filter(Boolean));

  return nav;
}

export function createBreadcrumbList(options: BreadcrumbListOptions = {}): HTMLElement {
  const { className } = options;

  const ol = document.createElement('ol');
  ol.className =
    'flex flex-wrap items-center gap-1.5 break-words text-sm text-muted-foreground sm:gap-2.5';
  if (className) ol.classList.add(...className.split(' ').filter(Boolean));

  return ol;
}

export function createBreadcrumbItem(options: BreadcrumbItemOptions = {}): HTMLElement {
  const { className } = options;

  const li = document.createElement('li');
  li.className = 'inline-flex items-center gap-1.5';
  if (className) li.classList.add(...className.split(' ').filter(Boolean));

  return li;
}

export function createBreadcrumbLink(options: BreadcrumbLinkOptions): HTMLAnchorElement {
  const { href, text = '', className } = options;

  const a = document.createElement('a');
  a.href = href;
  a.className = 'transition-colors hover:text-foreground';
  if (className) a.classList.add(...className.split(' ').filter(Boolean));
  if (text) a.textContent = text;

  return a;
}

export function createBreadcrumbPage(options: BreadcrumbPageOptions = {}): HTMLElement {
  const { text = '', className } = options;

  const span = document.createElement('span');
  span.setAttribute('role', 'link');
  span.setAttribute('aria-current', 'page');
  span.setAttribute('aria-disabled', 'true');
  span.className = 'font-normal text-foreground';
  if (className) span.classList.add(...className.split(' ').filter(Boolean));
  if (text) span.textContent = text;

  return span;
}

export function createBreadcrumbSeparator(options: BreadcrumbSeparatorOptions = {}): HTMLElement {
  const { content = '›', className } = options;

  const li = document.createElement('li');
  li.setAttribute('role', 'presentation');
  li.setAttribute('aria-hidden', 'true');
  li.className = '[&>svg]:size-3.5';
  if (className) li.classList.add(...className.split(' ').filter(Boolean));

  if (typeof content === 'string') {
    li.textContent = content;
  } else {
    li.appendChild(content);
  }

  return li;
}

/**
 * Renders an ellipsis indicator used when some breadcrumb items are collapsed.
 * Callers should wire up a click handler to expand the hidden items.
 */
export function createBreadcrumbEllipsis(options: BreadcrumbEllipsisOptions = {}): HTMLElement {
  const { label = 'More pages', className } = options;

  const span = document.createElement('span');
  span.setAttribute('role', 'presentation');
  span.setAttribute('aria-label', label);
  span.className =
    'inline-flex h-9 w-9 items-center justify-center';
  if (className) span.classList.add(...className.split(' ').filter(Boolean));
  span.textContent = '…';

  return span;
}
