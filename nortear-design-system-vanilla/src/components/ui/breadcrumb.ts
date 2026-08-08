import { cn } from '@/lib/utils';
// ─── Breadcrumb — Vanilla factories standalone ──────────────────────────────
//
// Visual: classes .nds-breadcrumb-* (standalone).

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
  /**
   * Nome acessível do indicador de níveis ocultos. Com rótulo, as reticências
   * são anunciadas; sem ele, ficam decorativas — que é o certo quando um
   * gatilho as envolve e já carrega o próprio nome.
   */
  label?: string;
  className?: string;
}

export function createBreadcrumb(options: BreadcrumbOptions = {}): HTMLElement {
  const { label = 'breadcrumb', className } = options;

  const nav = document.createElement('nav');
  nav.dataset.slot = 'breadcrumb';
  nav.setAttribute('aria-label', label);
  nav.className = cn('nds-breadcrumb', className);

  return nav;
}

export function createBreadcrumbList(options: BreadcrumbListOptions = {}): HTMLElement {
  const { className } = options;

  const ol = document.createElement('ol');
  ol.dataset.slot = 'breadcrumb-list';
  ol.className = cn('nds-breadcrumb-list', className);

  return ol;
}

export function createBreadcrumbItem(options: BreadcrumbItemOptions = {}): HTMLElement {
  const { className } = options;

  const li = document.createElement('li');
  li.dataset.slot = 'breadcrumb-item';
  li.className = cn('nds-breadcrumb-item', className);

  return li;
}

export function createBreadcrumbLink(options: BreadcrumbLinkOptions): HTMLAnchorElement {
  const { href, text = '', className } = options;

  const a = document.createElement('a');
  a.dataset.slot = 'breadcrumb-link';
  a.href = href;
  a.className = cn('nds-breadcrumb-link', className);
  if (text) a.textContent = text;

  return a;
}

export function createBreadcrumbPage(options: BreadcrumbPageOptions = {}): HTMLElement {
  const { text = '', className } = options;

  const span = document.createElement('span');
  span.dataset.slot = 'breadcrumb-page';
  // A anatomia documentada é literal: "último item com aria-current='page'; nunca é
  // link". O role="link" com aria-disabled fazia o leitor de tela anunciar
  // justamente o contrário — "link, desabilitado" — para um texto que nunca foi
  // navegável. Quem marca a página atual é o aria-current, e ele vale em
  // qualquer elemento.
  span.setAttribute('aria-current', 'page');
  span.className = cn('nds-breadcrumb-page', className);
  if (text) span.textContent = text;

  return span;
}

export function createBreadcrumbSeparator(options: BreadcrumbSeparatorOptions = {}): HTMLElement {
  const { content = '›', className } = options;

  const li = document.createElement('li');
  li.dataset.slot = 'breadcrumb-separator';
  li.setAttribute('role', 'presentation');
  li.setAttribute('aria-hidden', 'true');
  li.className = cn('nds-breadcrumb-separator', className);

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
  const { label, className } = options;

  const span = document.createElement('span');
  span.dataset.slot = 'breadcrumb-ellipsis';
  // O texto sr-only morava DENTRO de um aria-hidden: nenhum leitor de tela chegava
  // nele, então o rótulo não existia na prática — e ainda estava em inglês num
  // produto em português. As reticências são decorativas mesmo; quem nomeia o
  // conjunto oculto é o gatilho que as envolve, como na composição com menu.
  if (label) {
    span.setAttribute('role', 'img');
    span.setAttribute('aria-label', label);
  } else {
    span.setAttribute('aria-hidden', 'true');
  }
  span.className = cn('nds-breadcrumb-ellipsis', className);

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

  return span;
}
