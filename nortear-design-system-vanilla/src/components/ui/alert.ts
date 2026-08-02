// ─── Alert ───────────────────────────────────────────────────────────────────

import { createButton } from './button';

/**
 * Toca `.nds-animate-out` e só então executa `done`. As classes vivem em
 * `utilities.css` e servem a qualquer componente que apareça/suma em runtime.
 *
 * O timeout NÃO é redundância defensiva genérica: sem ele o alert nunca sai da
 * tela em dois cenários reais — `prefers-reduced-motion`, onde a animação é
 * suprimida e `animationend` jamais dispara, e ambiente sem composição de
 * quadros (Chromium headless dos testes), onde a animação fica presa no
 * primeiro quadro. Quem vencer a corrida remove o nó; `done` roda uma vez só.
 */
const EXIT_FALLBACK_MS = 300;  // --duration-base (200ms) + folga
const ENTER_FALLBACK_MS = 450; // --duration-spring (400ms) + folga

function runExitAnimation(el: HTMLElement, done: () => void): void {
  let finalizado = false;
  const finalizar = (event?: Event) => {
    // animationend borbulha: uma animação de qualquer descendente encerraria a
    // saída antes da hora. Só o próprio elemento conta.
    if (event && event.target !== el) return;
    if (finalizado) return;
    finalizado = true;
    window.clearTimeout(timer);
    el.removeEventListener('animationend', finalizar);
    done();
  };

  // Fechar antes da entrada terminar deixaria as duas classes no elemento.
  el.classList.remove('nds-animate-in');
  el.classList.add('nds-animate-out');
  el.addEventListener('animationend', finalizar);
  const timer = window.setTimeout(finalizar, EXIT_FALLBACK_MS);
}

export type AlertVariant = 'default' | 'destructive' | 'success' | 'warning' | 'info';

/**
 * Semântica de anúncio do elemento raiz.
 *
 * - `alert`  — live region ASSERTIVA: o leitor de tela interrompe o que estiver
 *   fazendo e anuncia na hora. Por WAI-ARIA só vale para mensagem urgente que
 *   **surge em tempo de execução**.
 * - `status` — live region polida: anuncia sem interromper.
 * - `note`   — NÃO é live region. É o certo para alert estático, já presente
 *   quando a página carrega.
 */
export type AlertRole = 'alert' | 'status' | 'note';

export interface AlertOptions {
  variant?: AlertVariant;
  /**
   * Semântica de anúncio no elemento raiz — default `'alert'`.
   * Use `'note'` para conteúdo estático (não vira live region).
   */
  role?: AlertRole;
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
  const { variant = 'default', role = 'alert', className, dismissible = false, onDismiss, dismissLabel = 'Fechar alerta' } = options;

  const el = document.createElement('div');
  // PATCH: a11y — `role` configurável. Fixo em 'alert' o componente era live
  // region assertiva mesmo estático, e o leitor de tela pulava para ele no
  // carregamento (ver PATCHES.md#alert-role).
  el.setAttribute('role', role);
  el.className = variant === 'default' ? 'nds-alert' : `nds-alert nds-alert-${variant}`;
  if (className) el.classList.add(...className.split(' ').filter(Boolean));

  // PATCH: api — variante dismissible: botão X remove o alert e chama onDismiss
  // uma única vez (ver PATCHES.md#alert-dismissible)
  if (dismissible) {
    // O snippet da story vem do outerHTML — a configuração precisa estar no DOM.
    el.dataset.dismissible = 'true';

    // Entrada: a classe é TRANSITÓRIA. Fica no DOM só enquanto a animação
    // roda e é removida em seguida — se ficasse, um ambiente que não avança
    // a animação (headless) manteria o alert preso em opacity: 0, invisível.
    el.classList.add('nds-animate-in');
    const limparEntrada = (event?: Event) => {
      if (event && event.target !== el) return; // animationend borbulha
      el.classList.remove('nds-animate-in');
      el.removeEventListener('animationend', limparEntrada);
    };
    el.addEventListener('animationend', limparEntrada);
    window.setTimeout(limparEntrada, ENTER_FALLBACK_MS);

    let dismissed = false;
    const dismissButton = createButton({
      variant: 'ghost',
      size: 'icon-sm',
      ariaLabel: dismissLabel,
      class: 'nds-alert-dismiss',
      onClick: () => {
        if (dismissed) return;
        dismissed = true;
        // Anima a saída antes de remover. NUNCA depender só de animationend:
        // com prefers-reduced-motion a animação não existe e o evento nunca
        // dispara; em ambiente que não compõe quadros (Chromium headless) ela
        // fica presa. O timeout é o que garante que o nó sempre sai.
        runExitAnimation(el, () => {
          el.remove();
          onDismiss?.();
        });
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
