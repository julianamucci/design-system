// ─── Alert Dialog — Vanilla factory (portal manual) ──────────────────────────
//
// Visual: classes .nds-alert-dialog-* (standalone, sem Tailwind/basecoat-css).
// Comportamentos preservados:
//   - Sem overlay-click-to-close e sem Escape-to-close (canônico para alert dialog).
//   - Focus trap (Tab/Shift+Tab) entre cancel e action.
//   - Restaura foco no elemento anterior ao fechar.
//   - MutationObserver fecha o dialog quando o wrapper é removido do DOM
//     (Storybook remount entre stories).

// ─── Types ───────────────────────────────────────────────────────────────────

export type AlertDialogOptions = {
  trigger: HTMLElement;
  title: string;
  description?: string;
  cancelButton: HTMLElement;
  actionButton: HTMLElement;
  onOpenChange?: (open: boolean) => void;
  class?: string;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

let _alertDialogCounter = 0;

function getFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    )
  ).filter(el => !el.closest('[hidden]'));
}

// ─── createAlertDialog ───────────────────────────────────────────────────────

export function createAlertDialog(options: AlertDialogOptions): HTMLElement {
  const { trigger, title, description, cancelButton, actionButton, onOpenChange } = options;

  const id = ++_alertDialogCounter;
  const titleId = `alert-dialog-title-${id}`;
  const descId = `alert-dialog-desc-${id}`;

  let overlayEl: HTMLElement | null = null;
  let panelEl: HTMLElement | null = null;
  let previousFocus: HTMLElement | null = null;

  const wrapper = document.createElement('div');
  wrapper.dataset.slot = 'alert-dialog';
  wrapper.appendChild(trigger);

  function open(): void {
    previousFocus = document.activeElement as HTMLElement;

    overlayEl = document.createElement('div');
    overlayEl.className = 'nds-alert-dialog-overlay';
    overlayEl.dataset.slot = 'alert-dialog-overlay';

    panelEl = document.createElement('div');
    panelEl.className = 'nds-alert-dialog-content';
    if (options.class) panelEl.classList.add(...options.class.split(' ').filter(Boolean));
    panelEl.setAttribute('role', 'alertdialog');
    panelEl.setAttribute('aria-modal', 'true');
    panelEl.setAttribute('aria-labelledby', titleId);
    if (description) panelEl.setAttribute('aria-describedby', descId);
    panelEl.dataset.slot = 'alert-dialog-content';

    // Header
    const headerEl = document.createElement('div');
    headerEl.className = 'nds-alert-dialog-header';
    headerEl.dataset.slot = 'alert-dialog-header';

    const titleEl = document.createElement('h2');
    titleEl.id = titleId;
    titleEl.className = 'nds-alert-dialog-title';
    titleEl.textContent = title;
    headerEl.appendChild(titleEl);

    if (description) {
      const descEl = document.createElement('p');
      descEl.id = descId;
      descEl.className = 'nds-alert-dialog-description';
      descEl.textContent = description;
      headerEl.appendChild(descEl);
    }

    // Footer
    const footerEl = document.createElement('div');
    footerEl.className = 'nds-alert-dialog-footer';
    footerEl.dataset.slot = 'alert-dialog-footer';
    footerEl.appendChild(cancelButton);
    footerEl.appendChild(actionButton);

    panelEl.appendChild(headerEl);
    panelEl.appendChild(footerEl);

    document.body.appendChild(overlayEl);
    document.body.appendChild(panelEl);

    cancelButton.focus();

    document.addEventListener('keydown', handleKeydown);
    onOpenChange?.(true);
  }

  function close(): void {
    overlayEl?.remove();
    panelEl?.remove();
    overlayEl = null;
    panelEl = null;
    document.removeEventListener('keydown', handleKeydown);
    previousFocus?.focus();
    onOpenChange?.(false);
  }

  function handleKeydown(e: KeyboardEvent): void {
    // No Escape-to-close for alert-dialog (decisão deliberada — exige escolha explícita).
    if (e.key === 'Tab' && panelEl) {
      const focusable = getFocusable(panelEl);
      if (!focusable.length) { e.preventDefault(); return; }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
  }

  cancelButton.addEventListener('click', close);
  actionButton.addEventListener('click', close);

  trigger.addEventListener('click', open);

  // Cleanup ao remover o wrapper (Storybook remount).
  if (typeof MutationObserver !== 'undefined') {
    const observer = new MutationObserver(() => {
      if (!wrapper.isConnected) {
        if (panelEl) close();
        observer.disconnect();
      }
    });
    const startObserve = () => {
      observer.observe(document.body, { childList: true, subtree: true });
    };
    if (document.body) startObserve();
    else queueMicrotask(startObserve);
  }

  return wrapper;
}
