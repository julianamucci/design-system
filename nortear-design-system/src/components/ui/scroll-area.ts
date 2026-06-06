// ─── ScrollArea — Vanilla factory standalone ────────────────────────────────
// Visual: classes .nds-scroll-area + .nds-scroll-area-viewport (zero Tailwind).

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
  root.className = 'nds-scroll-area';
  if (options.class) root.classList.add(...options.class.split(' ').filter(Boolean));
  if (height) root.style.height = height;
  if (width) root.style.width = width;

  const viewport = document.createElement('div');
  viewport.dataset.slot = 'scroll-area-viewport';
  viewport.className = 'nds-scroll-area-viewport';
  // Scrollable regions must be keyboard focusable (WCAG SC 2.1.1).
  viewport.setAttribute('tabindex', '0');
  if (height) viewport.style.maxHeight = height;

  if (children) viewport.appendChild(children);

  root.appendChild(viewport);
  return root;
}
