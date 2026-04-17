import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

export type PopoverSide = 'top' | 'bottom' | 'left' | 'right';
export type PopoverAlign = 'start' | 'center' | 'end';

export type PopoverOptions = {
  trigger: HTMLElement;
  content: HTMLElement | string;
  side?: PopoverSide;
  align?: PopoverAlign;
  onOpenChange?: (open: boolean) => void;
  class?: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

let _popoverCounter = 0;

function positionFloating(
  anchor: HTMLElement,
  panel: HTMLElement,
  side: PopoverSide,
  align: PopoverAlign
): void {
  const rect = anchor.getBoundingClientRect();
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;
  const gap = 8;

  // Temporarily make visible to measure
  panel.style.visibility = 'hidden';
  panel.style.display = 'block';
  const pw = panel.offsetWidth;
  const ph = panel.offsetHeight;
  panel.style.visibility = '';

  let top = 0;
  let left = 0;

  if (side === 'bottom') {
    top = rect.bottom + scrollY + gap;
  } else if (side === 'top') {
    top = rect.top + scrollY - ph - gap;
  } else if (side === 'left') {
    left = rect.left + scrollX - pw - gap;
  } else if (side === 'right') {
    left = rect.right + scrollX + gap;
  }

  if (side === 'bottom' || side === 'top') {
    if (align === 'start') left = rect.left + scrollX;
    else if (align === 'end') left = rect.right + scrollX - pw;
    else left = rect.left + scrollX + rect.width / 2 - pw / 2;
  } else {
    if (align === 'start') top = rect.top + scrollY;
    else if (align === 'end') top = rect.bottom + scrollY - ph;
    else top = rect.top + scrollY + rect.height / 2 - ph / 2;
  }

  panel.style.top = `${top}px`;
  panel.style.left = `${left}px`;
}

// ─── createPopover ────────────────────────────────────────────────────────────

export function createPopover(options: PopoverOptions): HTMLElement {
  const {
    trigger,
    content,
    side = 'bottom',
    align = 'center',
    onOpenChange,
  } = options;

  const id = ++_popoverCounter;
  const contentId = `popover-content-${id}`;

  let panelEl: HTMLElement | null = null;
  let isOpen = false;

  const wrapper = document.createElement('div');
  wrapper.dataset.slot = 'popover';
  wrapper.style.display = 'contents';
  wrapper.appendChild(trigger);

  trigger.setAttribute('aria-expanded', 'false');
  trigger.setAttribute('aria-controls', contentId);

  function open(): void {
    panelEl = document.createElement('div');
    panelEl.id = contentId;
    panelEl.className = cn(
      'z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md popover',
      options.class
    );
    panelEl.dataset.slot = 'popover-content';
    panelEl.style.position = 'absolute';

    if (typeof content === 'string') {
      panelEl.textContent = content;
    } else {
      panelEl.appendChild(content);
    }

    document.body.appendChild(panelEl);
    positionFloating(trigger, panelEl, side, align);

    trigger.setAttribute('aria-expanded', 'true');
    isOpen = true;

    document.addEventListener('keydown', handleKeydown);
    // Defer so this open click doesn't immediately trigger the outside-click close
    setTimeout(() => document.addEventListener('click', handleOutsideClick), 0);

    onOpenChange?.(true);
  }

  function close(): void {
    panelEl?.remove();
    panelEl = null;
    trigger.setAttribute('aria-expanded', 'false');
    isOpen = false;

    document.removeEventListener('keydown', handleKeydown);
    document.removeEventListener('click', handleOutsideClick);

    onOpenChange?.(false);
  }

  function handleKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
      trigger.focus();
    }
  }

  function handleOutsideClick(e: MouseEvent): void {
    const target = e.target as Node;
    if (!panelEl?.contains(target) && !trigger.contains(target)) {
      close();
    }
  }

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    if (isOpen) close(); else open();
  });

  return wrapper;
}
