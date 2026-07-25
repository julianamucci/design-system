import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ScrollAreaOptions = {
  height?: string;
  width?: string;
  class?: string;
  children?: HTMLElement;
};

// ─── createScrollArea ─────────────────────────────────────────────────────────

export function createScrollArea(options: ScrollAreaOptions = {}): HTMLElement {
  const { height, width, children } = options;

  const root = document.createElement('div');
  root.dataset.slot = 'scroll-area';
  root.className = cn('relative overflow-hidden scrollbar', options.class);
  if (height) root.style.height = height;
  if (width) root.style.width = width;

  const viewport = document.createElement('div');
  viewport.dataset.slot = 'scroll-area-viewport';
  viewport.className = 'h-full w-full rounded-[inherit] overflow-auto';
  if (height) viewport.style.maxHeight = height;

  if (children) viewport.appendChild(children);

  root.appendChild(viewport);
  return root;
}
