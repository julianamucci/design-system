// ─── Alert ───────────────────────────────────────────────────────────────────

export type AlertVariant = 'default' | 'destructive';

export interface AlertOptions {
  variant?: AlertVariant;
  /** Additional CSS classes to append. */
  className?: string;
}

export interface AlertTitleOptions {
  text?: string;
  className?: string;
}

export interface AlertDescriptionOptions {
  text?: string;
  className?: string;
}

export function createAlert(options: AlertOptions = {}): HTMLElement {
  const { variant = 'default', className } = options;

  const el = document.createElement('div');
  el.setAttribute('role', 'alert');
  el.className = variant === 'destructive' ? 'alert alert-destructive' : 'alert';
  if (className) el.classList.add(...className.split(' ').filter(Boolean));

  return el;
}

export function createAlertTitle(options: AlertTitleOptions = {}): HTMLElement {
  const { text = '', className } = options;

  const el = document.createElement('h5');
  if (className) el.classList.add(...className.split(' ').filter(Boolean));
  if (text) el.textContent = text;

  return el;
}

export function createAlertDescription(options: AlertDescriptionOptions = {}): HTMLElement {
  const { text = '', className } = options;

  // PATCH: a11y — basecoat-css aplica `col-start-2` no grid via seletor `> section`. Com <div> a descrição cai na col 1 (16px, coluna do ícone) e o texto quebra letra a letra. (ver PATCHES.md#basecoatalert--descrio-como-section-para-grid-do-basecoat-css)
  const el = document.createElement('section');
  if (className) el.classList.add(...className.split(' ').filter(Boolean));
  if (text) el.textContent = text;

  return el;
}

// ─── Icons ────────────────────────────────────────────────────────────────────

import { Info, AlertCircle, CheckCircle2, TriangleAlert } from 'lucide';

export type AlertIconType = 'info' | 'error' | 'success' | 'warning';

type LucideIconNode = [string, Record<string, string>];

const ALERT_ICON_MAP: Record<AlertIconType, LucideIconNode[]> = {
  info:    Info as unknown as LucideIconNode[],
  error:   AlertCircle as unknown as LucideIconNode[],
  success: CheckCircle2 as unknown as LucideIconNode[],
  warning: TriangleAlert as unknown as LucideIconNode[],
};

export function createAlertIcon(type: AlertIconType): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('class', 'h-4 w-4');

  for (const [tag, attrs] of ALERT_ICON_MAP[type]) {
    const child = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [k, v] of Object.entries(attrs)) child.setAttribute(k, v);
    svg.appendChild(child);
  }
  return svg;
}
