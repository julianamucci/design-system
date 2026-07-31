// ─── Alert ───────────────────────────────────────────────────────────────────

import { createButton } from './button';

export type AlertVariant = 'default' | 'destructive' | 'success' | 'warning' | 'info';

export interface AlertOptions {
  variant?: AlertVariant;
  /** Additional CSS classes to append. */
  className?: string;
  /** Renderiza o botão de fechar (X) no canto superior direito. */
  dismissible?: boolean;
  /** Disparado uma única vez, quando o usuário aciona o botão de fechar. */
  onDismiss?: () => void;
  /** aria-label do botão de fechar. */
  dismissLabel?: string;
}

export interface AlertTitleOptions {
  text?: string;
  /** Nível do heading do título — default 'h5'. */
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  className?: string;
}

export interface AlertDescriptionOptions {
  text?: string;
  className?: string;
}

export function createAlert(options: AlertOptions = {}): HTMLElement {
  const { variant = 'default', className, dismissible = false, onDismiss, dismissLabel = 'Fechar alerta' } = options;

  const el = document.createElement('div');
  el.setAttribute('role', 'alert');
  el.className = variant === 'default' ? 'nds-alert' : `nds-alert nds-alert-${variant}`;
  if (className) el.classList.add(...className.split(' ').filter(Boolean));

  // PATCH: api — variante dismissible: botão X remove o alert e chama onDismiss
  // uma única vez (ver PATCHES.md#alert-dismissible)
  if (dismissible) {
    // O snippet da story vem do outerHTML — a configuração precisa estar no DOM.
    el.dataset.dismissible = 'true';

    let dismissed = false;
    const dismissButton = createButton({
      variant: 'ghost',
      size: 'icon-sm',
      ariaLabel: dismissLabel,
      class: 'nds-alert-dismiss',
      onClick: () => {
        if (dismissed) return;
        dismissed = true;
        el.remove();
        onDismiss?.();
      },
    });
    dismissButton.dataset.slot = 'alert-dismiss';
    dismissButton.appendChild(createDismissIcon());
    el.appendChild(dismissButton);
    // Ordem no DOM: o consumidor appenda ícone/título/descrição DEPOIS do
    // createAlert, o que deixaria o X como primeiro filho — leitor de tela
    // anunciaria "Fechar alerta" antes do conteúdo, divergindo das outras 3
    // stacks (lá o X renderiza após os children). O microtask reposiciona o
    // botão para o fim depois que os appends síncronos do consumidor rodarem.
    // Visual não muda (position: absolute); só a ordem de leitura e de Tab.
    queueMicrotask(() => {
      if (el.lastElementChild !== dismissButton) el.appendChild(dismissButton);
    });
  }

  return el;
}

export function createAlertTitle(options: AlertTitleOptions = {}): HTMLElement {
  const { text = '', as = 'h5', className } = options;

  // PATCH: api — nível do heading configurável via `as`, default 'h5'
  // (ver PATCHES.md#alert-title-desc-semantics)
  const el = document.createElement(as);
  el.className = 'nds-alert-title';
  if (className) el.classList.add(...className.split(' ').filter(Boolean));
  if (text) el.textContent = text;

  return el;
}

export function createAlertDescription(options: AlertDescriptionOptions = {}): HTMLElement {
  const { text = '', className } = options;

  // <section> preserva a semântica de landmark da descrição. CSS aceita tanto
  // section quanto qualquer elemento com class nds-alert-description.
  const el = document.createElement('section');
  el.className = 'nds-alert-description';
  if (className) el.classList.add(...className.split(' ').filter(Boolean));
  if (text) el.textContent = text;

  return el;
}

export interface AlertActionOptions {
  className?: string;
}

/**
 * Slot de ação no canto superior direito do alert (`.nds-alert-action`).
 * Devolve o container vazio — o consumidor injeta o botão via `createButton`.
 * O CSS já reserva o padding-inline-end quando o alert tem `.nds-alert-action`.
 */
export function createAlertAction(options: AlertActionOptions = {}): HTMLElement {
  const { className } = options;

  const el = document.createElement('div');
  el.dataset.slot = 'alert-action';
  el.className = 'nds-alert-action';
  if (className) el.classList.add(...className.split(' ').filter(Boolean));

  return el;
}

// ─── Icons ────────────────────────────────────────────────────────────────────

import { Info, AlertCircle, CheckCircle2, TriangleAlert, X } from 'lucide';

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
  // .nds-alert > svg já define width/height 16px via CSS — não precisa setar via class.

  for (const [tag, attrs] of ALERT_ICON_MAP[type]) {
    const child = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [k, v] of Object.entries(attrs)) child.setAttribute(k, v);
    svg.appendChild(child);
  }
  return svg;
}

/** Ícone X do botão de fechar — mesmo padrão de montagem por nós do lucide. */
function createDismissIcon(): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('class', 'nds-icon');

  for (const [tag, attrs] of X as unknown as LucideIconNode[]) {
    const child = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [k, v] of Object.entries(attrs)) child.setAttribute(k, v);
    svg.appendChild(child);
  }
  return svg;
}
