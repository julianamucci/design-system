import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

export type HoverCardSide = 'top' | 'bottom' | 'left' | 'right';
export type HoverCardAlign = 'start' | 'center' | 'end';

export type HoverCardOptions = {
  trigger: HTMLElement;
  content: HTMLElement;
  side?: HoverCardSide;
  align?: HoverCardAlign;
  onOpenChange?: (open: boolean) => void;
  class?: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

let _hoverCardCounter = 0;
const SHOW_DELAY = 300;
const HIDE_DELAY = 150;

function positionHoverCard(
  anchor: HTMLElement,
  panel: HTMLElement,
  side: HoverCardSide,
  align: HoverCardAlign
): void {
  const rect = anchor.getBoundingClientRect();
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;
  const gap = 8;

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
  } else {
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

// ─── createHoverCard ──────────────────────────────────────────────────────────

export function createHoverCard(options: HoverCardOptions): HTMLElement {
  const {
    trigger,
    content,
    side = 'bottom',
    align = 'center',
    onOpenChange,
  } = options;

  const id = ++_hoverCardCounter;
  const cardId = `hover-card-${id}`;

  let panelEl: HTMLElement | null = null;
  let showTimer: ReturnType<typeof setTimeout> | null = null;
  let hideTimer: ReturnType<typeof setTimeout> | null = null;

  const wrapper = document.createElement('div');
  wrapper.dataset.slot = 'hover-card';
  wrapper.style.display = 'contents';
  wrapper.appendChild(trigger);

  function show(): void {
    if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
    if (panelEl) return;

    panelEl = document.createElement('div');
    panelEl.id = cardId;
    panelEl.setAttribute('role', 'dialog');
    panelEl.className = cn(
      'z-50 w-80 rounded-md border bg-popover p-4 text-popover-foreground shadow-md',
      options.class
    );
    panelEl.dataset.slot = 'hover-card-content';
    panelEl.style.position = 'absolute';
    panelEl.appendChild(content);

    document.body.appendChild(panelEl);
    positionHoverCard(trigger, panelEl, side, align);

    // Keep card open while hovering over it
    panelEl.addEventListener('mouseenter', () => {
      if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
    });
    panelEl.addEventListener('mouseleave', scheduleHide);

    onOpenChange?.(true);
  }

  function hide(): void {
    panelEl?.remove();
    panelEl = null;
    onOpenChange?.(false);
  }

  function scheduleShow(): void {
    if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
    showTimer = setTimeout(show, SHOW_DELAY);
  }

  function scheduleHide(): void {
    if (showTimer) { clearTimeout(showTimer); showTimer = null; }
    hideTimer = setTimeout(hide, HIDE_DELAY);
  }

  trigger.addEventListener('mouseenter', scheduleShow);
  trigger.addEventListener('mouseleave', scheduleHide);

  return wrapper;
}
