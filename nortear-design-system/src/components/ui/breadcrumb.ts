// ─── Breadcrumb — Vanilla factories standalone ──────────────────────────────
//
// Visual: classes .nds-breadcrumb-* (zero Tailwind/basecoat-css).

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
  /** Accessible label for the ellipsis (default: "More"). */
  label?: string;
  className?: string;
}

export function createBreadcrumb(options: BreadcrumbOptions = {}): HTMLElement {
  const { label = 'breadcrumb', className } = options;

  const nav = document.createElement('nav');
  nav.dataset.slot = 'breadcrumb';
  nav.setAttribute('aria-label', label);
  nav.className = 'nds-breadcrumb';
  if (className) nav.classList.add(...className.split(' ').filter(Boolean));

  return nav;
}

export function createBreadcrumbList(options: BreadcrumbListOptions = {}): HTMLElement {
  const { className } = options;

  const ol = document.createElement('ol');
  ol.dataset.slot = 'breadcrumb-list';
  ol.className = 'nds-breadcrumb-list';
  if (className) ol.classList.add(...className.split(' ').filter(Boolean));

  return ol;
}

export function createBreadcrumbItem(options: BreadcrumbItemOptions = {}): HTMLElement {
  const { className } = options;

  const li = document.createElement('li');
  li.dataset.slot = 'breadcrumb-item';
  li.className = 'nds-breadcrumb-item';
  if (className) li.classList.add(...className.split(' ').filter(Boolean));

  return li;
}

export function createBreadcrumbLink(options: BreadcrumbLinkOptions): HTMLAnchorElement {
  const { href, text = '', className } = options;

  const a = document.createElement('a');
  a.dataset.slot = 'breadcrumb-link';
  a.href = href;
  a.className = 'nds-breadcrumb-link';
  if (className) a.classList.add(...className.split(' ').filter(Boolean));
  if (text) a.textContent = text;

  return a;
}

export function createBreadcrumbPage(options: BreadcrumbPageOptions = {}): HTMLElement {
  const { text = '', className } = options;

  const span = document.createElement('span');
  span.dataset.slot = 'breadcrumb-page';
  span.setAttribute('role', 'link');
  span.setAttribute('aria-current', 'page');
  span.setAttribute('aria-disabled', 'true');
  span.className = 'nds-breadcrumb-page';
  if (className) span.classList.add(...className.split(' ').filter(Boolean));
  if (text) span.textContent = text;

  return span;
}

export function createBreadcrumbSeparator(options: BreadcrumbSeparatorOptions = {}): HTMLElement {
  const { content = '›', className } = options;

  const li = document.createElement('li');
  li.dataset.slot = 'breadcrumb-separator';
  li.setAttribute('role', 'presentation');
  li.setAttribute('aria-hidden', 'true');
  li.className = 'nds-breadcrumb-separator';
  if (className) li.classList.add(...className.split(' ').filter(Boolean));

  if (typeof content === 'string') {
    li.textContent = content;
  } else {
    li.appendChild(content);
  }

  return li;
}

/**
 * Indicador de overflow (MoreHorizontal). Quando algumas trilhas são colapsadas,
 * o consumidor liga um click handler externo pra expandir.
 */
export function createBreadcrumbEllipsis(options: BreadcrumbEllipsisOptions = {}): HTMLElement {
  const { label = 'More', className } = options;

  const span = document.createElement('span');
  span.dataset.slot = 'breadcrumb-ellipsis';
  span.setAttribute('role', 'presentation');
  span.setAttribute('aria-hidden', 'true');
  span.setAttribute('aria-label', label);
  span.className = 'nds-breadcrumb-ellipsis';
  if (className) span.classList.add(...className.split(' ').filter(Boolean));

  // SVG MoreHorizontal — anexado via createElementNS (sem innerHTML em elemento de fluxo).
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('xmlns', SVG_NS);
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  for (const cx of ['5', '12', '19']) {
    const c = document.createElementNS(SVG_NS, 'circle');
    c.setAttribute('cx', cx);
    c.setAttribute('cy', '12');
    c.setAttribute('r', '1');
    svg.appendChild(c);
  }
  span.appendChild(svg);

  const srOnly = document.createElement('span');
  srOnly.className = 'nds-sr-only';
  srOnly.textContent = label;
  span.appendChild(srOnly);

  return span;
}
