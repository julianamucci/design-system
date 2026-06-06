// ─── Sheet — Vanilla factory standalone ─────────────────────────────────────
// Visual: classes .nds-sheet-* (zero Tailwind/basecoat-css). Render via portal.
// Comportamento: overlay click + Escape fecham; focus-trap.

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

// ─── Close icon helper ────────────────────────────────────────────────────────

const SVG_NS = 'http://www.w3.org/2000/svg';

function createCloseIcon(): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('xmlns', SVG_NS);
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  const p1 = document.createElementNS(SVG_NS, 'path');
  p1.setAttribute('d', 'M18 6 6 18');
  const p2 = document.createElementNS(SVG_NS, 'path');
  p2.setAttribute('d', 'm6 6 12 12');
  svg.appendChild(p1);
  svg.appendChild(p2);
  return svg;
}

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
    overlayEl.className = 'nds-sheet-overlay';
    overlayEl.dataset.slot = 'sheet-overlay';
    overlayEl.addEventListener('click', close);

    panelEl = document.createElement('div');
    panelEl.className = 'nds-sheet-content';
    if (options.class) panelEl.classList.add(...options.class.split(' ').filter(Boolean));
    panelEl.dataset.side = side;
    panelEl.setAttribute('role', 'dialog');
    panelEl.setAttribute('aria-modal', 'true');
    if (title) panelEl.setAttribute('aria-labelledby', titleId);
    if (description) panelEl.setAttribute('aria-describedby', descId);
    panelEl.dataset.slot = 'sheet-content';

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'nds-sheet-close';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.appendChild(createCloseIcon());
    closeBtn.addEventListener('click', close);

    // Header
    if (title || description) {
      const headerEl = document.createElement('div');
      headerEl.className = 'nds-sheet-header';
      headerEl.dataset.slot = 'sheet-header';

      if (title) {
        const titleEl = document.createElement('h2');
        titleEl.id = titleId;
        titleEl.className = 'nds-sheet-title';
        titleEl.textContent = title;
        headerEl.appendChild(titleEl);
      }

      if (description) {
        const descEl = document.createElement('p');
        descEl.id = descId;
        descEl.className = 'nds-sheet-description';
        descEl.textContent = description;
        headerEl.appendChild(descEl);
      }

      panelEl.appendChild(headerEl);
    }

    // Body
    const bodyEl = document.createElement('div');
    bodyEl.className = 'nds-sheet-body';
    bodyEl.dataset.slot = 'sheet-body';
    bodyEl.setAttribute('tabindex', '0');
    bodyEl.appendChild(content);
    panelEl.appendChild(bodyEl);

    if (footer) {
      const footerEl = document.createElement('div');
      footerEl.className = 'nds-sheet-footer';
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
