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
    'flex flex-wrap items-center gap-1.5 text-sm wrap-break-word text-muted-foreground';
  if (className) ol.classList.add(...className.split(' ').filter(Boolean));

  return ol;
}

export function createBreadcrumbItem(options: BreadcrumbItemOptions = {}): HTMLElement {
  const { className } = options;

  const li = document.createElement('li');
  li.className = 'inline-flex items-center gap-1';
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
 *
 * Paridade com React: ícone MoreHorizontal + `sr-only "More"` para leitores de tela.
 */
export function createBreadcrumbEllipsis(options: BreadcrumbEllipsisOptions = {}): HTMLElement {
  const { label = 'More', className } = options;

  const span = document.createElement('span');
  span.setAttribute('role', 'presentation');
  span.setAttribute('aria-hidden', 'true');
  span.className = 'flex size-5 items-center justify-center [&>svg]:size-4';
  if (className) span.classList.add(...className.split(' ').filter(Boolean));

  // Ícone MoreHorizontal (paridade com lucide-react MoreHorizontalIcon)
  span.innerHTML =
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>';

  // Texto acessível para leitores de tela
  const srOnly = document.createElement('span');
  srOnly.className = 'sr-only';
  srOnly.textContent = label;
  span.appendChild(srOnly);

  return span;
}
