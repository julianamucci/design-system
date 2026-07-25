import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

export type TooltipSide = 'top' | 'bottom' | 'left' | 'right';

export type TooltipOptions = {
  trigger: HTMLElement;
  content: string;
  side?: TooltipSide;
  class?: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

let _tooltipCounter = 0;
const SHOW_DELAY = 300;

function positionTooltip(
  anchor: HTMLElement,
  panel: HTMLElement,
  side: TooltipSide
): void {
  const rect = anchor.getBoundingClientRect();
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;
  const gap = 6;

  panel.style.visibility = 'hidden';
  panel.style.display = 'block';
  const pw = panel.offsetWidth;
  const ph = panel.offsetHeight;
  panel.style.visibility = '';

  let top = 0;
  let left = 0;

  if (side === 'top') {
    top = rect.top + scrollY - ph - gap;
    left = rect.left + scrollX + rect.width / 2 - pw / 2;
  } else if (side === 'bottom') {
    top = rect.bottom + scrollY + gap;
    left = rect.left + scrollX + rect.width / 2 - pw / 2;
  } else if (side === 'left') {
    top = rect.top + scrollY + rect.height / 2 - ph / 2;
    left = rect.left + scrollX - pw - gap;
  } else {
    top = rect.top + scrollY + rect.height / 2 - ph / 2;
    left = rect.right + scrollX + gap;
  }

  panel.style.top = `${top}px`;
  panel.style.left = `${left}px`;
}

// ─── createTooltip ────────────────────────────────────────────────────────────

export function createTooltip(options: TooltipOptions): HTMLElement {
  const { trigger, content, side = 'top' } = options;

  const id = ++_tooltipCounter;
  const tooltipId = `tooltip-${id}`;

  let panelEl: HTMLElement | null = null;
  let showTimer: ReturnType<typeof setTimeout> | null = null;

  const wrapper = document.createElement('div');
  wrapper.dataset.slot = 'tooltip';
  wrapper.style.display = 'contents';
  wrapper.appendChild(trigger);

  trigger.setAttribute('aria-describedby', tooltipId);

  function show(): void {
    if (panelEl) return;

    panelEl = document.createElement('div');
    panelEl.id = tooltipId;
    panelEl.setAttribute('role', 'tooltip');
    panelEl.className = cn(
      'z-50 overflow-hidden rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground',
      options.class
    );
    panelEl.dataset.slot = 'tooltip-content';
    panelEl.style.position = 'absolute';
    panelEl.textContent = content;

    document.body.appendChild(panelEl);
    positionTooltip(trigger, panelEl, side);
  }

  function hide(): void {
    if (showTimer) { clearTimeout(showTimer); showTimer = null; }
    panelEl?.remove();
    panelEl = null;
  }

  function scheduleShow(): void {
    showTimer = setTimeout(show, SHOW_DELAY);
  }

  trigger.addEventListener('mouseenter', scheduleShow);
  trigger.addEventListener('mouseleave', hide);
  trigger.addEventListener('focus', scheduleShow);
  trigger.addEventListener('blur', hide);

  return wrapper;
}
