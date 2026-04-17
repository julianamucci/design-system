import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

export type AlertDialogOptions = {
  trigger: HTMLElement;
  title: string;
  description?: string;
  cancelButton: HTMLElement;
  actionButton: HTMLElement;
  onOpenChange?: (open: boolean) => void;
  class?: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

let _alertDialogCounter = 0;

function getFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    )
  ).filter(el => !el.closest('[hidden]'));
}

// ─── createAlertDialog ────────────────────────────────────────────────────────

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
    overlayEl.className = 'fixed inset-0 z-50 bg-black/80';
    overlayEl.dataset.slot = 'alert-dialog-overlay';
    // No overlay click-to-close for alert-dialog

    panelEl = document.createElement('div');
    panelEl.className = cn(
      'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg sm:rounded-lg dialog',
      options.class
    );
    panelEl.setAttribute('role', 'alertdialog');
    panelEl.setAttribute('aria-modal', 'true');
    panelEl.setAttribute('aria-labelledby', titleId);
    if (description) panelEl.setAttribute('aria-describedby', descId);
    panelEl.dataset.slot = 'alert-dialog-content';

    // Header
    const headerEl = document.createElement('div');
    headerEl.className = 'flex flex-col space-y-1.5 text-center sm:text-left';
    headerEl.dataset.slot = 'alert-dialog-header';

    const titleEl = document.createElement('h2');
    titleEl.id = titleId;
    titleEl.className = 'text-lg font-semibold leading-none tracking-tight';
    titleEl.textContent = title;
    headerEl.appendChild(titleEl);

    if (description) {
      const descEl = document.createElement('p');
      descEl.id = descId;
      descEl.className = 'text-sm text-muted-foreground';
      descEl.textContent = description;
      headerEl.appendChild(descEl);
    }

    // Footer with cancel + action
    const footerEl = document.createElement('div');
    footerEl.className =
      'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2';
    footerEl.dataset.slot = 'alert-dialog-footer';
    footerEl.appendChild(cancelButton);
    footerEl.appendChild(actionButton);

    panelEl.appendChild(headerEl);
    panelEl.appendChild(footerEl);

    document.body.appendChild(overlayEl);
    document.body.appendChild(panelEl);

    // Focus the cancel button first (safer default for alert dialogs)
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
    // No Escape-to-close for alert-dialog
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

  // Allow cancel/action buttons to close the dialog
  cancelButton.addEventListener('click', close);
  actionButton.addEventListener('click', close);

  trigger.addEventListener('click', open);

  return wrapper;
}
