import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

export type SheetSide = 'top' | 'bottom' | 'left' | 'right';

export type SheetOptions = {
  trigger: HTMLElement;
  side?: SheetSide;
  title?: string;
  description?: string;
  content: HTMLElement;
  footer?: HTMLElement;
  onOpenChange?: (open: boolean) => void;
  class?: string;
};

// ─── Classes ──────────────────────────────────────────────────────────────────

const OVERLAY_CLASS = 'fixed inset-0 z-50 bg-black/80';

const SIDE_CLASSES: Record<SheetSide, string> = {
  right: 'fixed inset-y-0 right-0 z-50 h-full w-3/4 gap-4 border-l bg-background p-6 shadow-lg transition ease-in-out sm:max-w-sm',
  left:  'fixed inset-y-0 left-0 z-50 h-full w-3/4 gap-4 border-r bg-background p-6 shadow-lg transition ease-in-out sm:max-w-sm',
  top:   'fixed inset-x-0 top-0 z-50 h-auto gap-4 border-b bg-background p-6 shadow-lg transition ease-in-out',
  bottom:'fixed inset-x-0 bottom-0 z-50 h-auto gap-4 border-t bg-background p-6 shadow-lg transition ease-in-out',
};

const CLOSE_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';

let _sheetCounter = 0;

function getFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    )
  ).filter(el => !el.closest('[hidden]'));
}

// ─── createSheet ──────────────────────────────────────────────────────────────

export function createSheet(options: SheetOptions): HTMLElement {
  const { trigger, side = 'right', title, description, content, footer, onOpenChange } = options;

  const sheetId = ++_sheetCounter;
  const titleId = `sheet-title-${sheetId}`;
  const descId = `sheet-desc-${sheetId}`;

  let overlayEl: HTMLElement | null = null;
  let panelEl: HTMLElement | null = null;
  let previousFocus: HTMLElement | null = null;

  const wrapper = document.createElement('div');
  wrapper.dataset.slot = 'sheet';
  wrapper.appendChild(trigger);

  function open(): void {
    previousFocus = document.activeElement as HTMLElement;

    overlayEl = document.createElement('div');
    overlayEl.className = OVERLAY_CLASS;
    overlayEl.dataset.slot = 'sheet-overlay';
    overlayEl.addEventListener('click', close);

    panelEl = document.createElement('div');
    panelEl.className = cn(SIDE_CLASSES[side], options.class);
    panelEl.setAttribute('role', 'dialog');
    panelEl.setAttribute('aria-modal', 'true');
    if (title) panelEl.setAttribute('aria-labelledby', titleId);
    if (description) panelEl.setAttribute('aria-describedby', descId);
    panelEl.dataset.slot = 'sheet-content';
    panelEl.style.display = 'flex';
    panelEl.style.flexDirection = 'column';

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 focus:ring-2 focus:ring-ring';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.innerHTML = CLOSE_SVG;
    closeBtn.addEventListener('click', close);

    // Header
    if (title || description) {
      const headerEl = document.createElement('div');
      headerEl.className = 'flex flex-col space-y-1.5 text-center sm:text-left mb-4';
      headerEl.dataset.slot = 'sheet-header';

      if (title) {
        const titleEl = document.createElement('h2');
        titleEl.id = titleId;
        titleEl.className = 'text-lg font-semibold leading-none tracking-tight';
        titleEl.textContent = title;
        headerEl.appendChild(titleEl);
      }

      if (description) {
        const descEl = document.createElement('p');
        descEl.id = descId;
        descEl.className = 'text-sm text-muted-foreground';
        descEl.textContent = description;
        headerEl.appendChild(descEl);
      }

      panelEl.appendChild(headerEl);
    }

    // Body
    const bodyEl = document.createElement('div');
    bodyEl.className = 'flex-1 overflow-auto';
    bodyEl.dataset.slot = 'sheet-body';
    bodyEl.appendChild(content);
    panelEl.appendChild(bodyEl);

    if (footer) {
      const footerEl = document.createElement('div');
      footerEl.className = 'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-4';
      footerEl.dataset.slot = 'sheet-footer';
      footerEl.appendChild(footer);
      panelEl.appendChild(footerEl);
    }

    panelEl.appendChild(closeBtn);

    document.body.appendChild(overlayEl);
    document.body.appendChild(panelEl);

    const focusable = getFocusable(panelEl);
    focusable[0]?.focus();

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
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
      return;
    }
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

  trigger.addEventListener('click', open);
  return wrapper;
}
