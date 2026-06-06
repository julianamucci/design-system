// ─── Sidebar — Vanilla factory standalone ───────────────────────────────────
// Visual: classes .nds-sidebar-* (zero Tailwind/basecoat-css).
// Shortcut: Ctrl/Cmd+B alterna expanded/collapsed.

import { createButton } from './button';

const SIDEBAR_KEYBOARD_SHORTCUT = 'b';

export type SidebarState = 'expanded' | 'collapsed';
export type SidebarSide = 'left' | 'right';
export type SidebarVariant = 'sidebar' | 'floating' | 'inset';

export type SidebarOptions = {
  defaultOpen?: boolean;
  side?: SidebarSide;
  variant?: SidebarVariant;
  onOpenChange?: (open: boolean) => void;
  class?: string;
};

export type SidebarMenuItemOptions = {
  icon?: SVGElement | HTMLElement;
  label: string;
  href?: string;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  badge?: string;
};

export type SidebarGroupOptions = {
  label?: string;
  items: SidebarMenuItemOptions[];
};

export type SidebarInstance = {
  element: HTMLElement;
  toggle: () => void;
  open: () => void;
  close: () => void;
  getState: () => SidebarState;
};

export function createSidebarProvider(
  options: { children?: HTMLElement } = {}
): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'nds-sidebar-wrapper';
  if (options.children) wrapper.appendChild(options.children);
  return wrapper;
}

export function createSidebar(options: SidebarOptions = {}): SidebarInstance {
  const { defaultOpen = true, side = 'left', variant = 'sidebar', onOpenChange } = options;
  let isOpen = defaultOpen;

  const root = document.createElement('div');
  root.className = 'nds-sidebar-root';
  if (options.class) root.classList.add(...options.class.split(' ').filter(Boolean));
  root.dataset.state = isOpen ? 'expanded' : 'collapsed';
  root.dataset.side = side;
  root.dataset.variant = variant;

  const gap = document.createElement('div');
  gap.className = 'nds-sidebar-gap';
  gap.dataset.state = isOpen ? 'expanded' : 'collapsed';

  const gapInner = document.createElement('div');
  gapInner.className = 'nds-sidebar-gap-inner';
  gap.appendChild(gapInner);

  const panel = document.createElement('div');
  panel.className = 'nds-sidebar-panel';

  const inner = document.createElement('div');
  inner.className = 'nds-sidebar-inner';
  inner.setAttribute('data-sidebar', 'sidebar');
  panel.appendChild(inner);
  root.append(gap, panel);

  function setState(open: boolean) {
    isOpen = open;
    const state = open ? 'expanded' : 'collapsed';
    root.dataset.state = state;
    gap.dataset.state = state;
    onOpenChange?.(open);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === SIDEBAR_KEYBOARD_SHORTCUT && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      setState(!isOpen);
    }
  }
  document.addEventListener('keydown', handleKeydown);

  return {
    element: root,
    toggle: () => setState(!isOpen),
    open: () => setState(true),
    close: () => setState(false),
    getState: () => (isOpen ? 'expanded' : 'collapsed'),
  };
}

export function createSidebarTrigger(
  toggleFn: () => void,
  options: { class?: string } = {}
): HTMLButtonElement {
  const btn = createButton({ variant: 'ghost', size: 'icon', class: options.class });
  btn.setAttribute('data-sidebar', 'trigger');
  btn.setAttribute('aria-label', 'Toggle sidebar');
  // PanelLeft icon via createElementNS (sem innerHTML)
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('xmlns', SVG_NS);
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  const rect = document.createElementNS(SVG_NS, 'rect');
  rect.setAttribute('width', '18');
  rect.setAttribute('height', '18');
  rect.setAttribute('x', '3');
  rect.setAttribute('y', '3');
  rect.setAttribute('rx', '2');
  const line = document.createElementNS(SVG_NS, 'path');
  line.setAttribute('d', 'M9 3v18');
  svg.append(rect, line);
  btn.appendChild(svg);
  btn.addEventListener('click', toggleFn);
  return btn;
}

export function createSidebarContent(options: { class?: string } = {}): HTMLElement {
  const el = document.createElement('div');
  el.className = 'nds-sidebar-content';
  if (options.class) el.classList.add(...options.class.split(' ').filter(Boolean));
  el.setAttribute('data-sidebar', 'content');
  return el;
}

export function createSidebarHeader(options: { class?: string } = {}): HTMLElement {
  const el = document.createElement('div');
  el.className = 'nds-sidebar-header';
  if (options.class) el.classList.add(...options.class.split(' ').filter(Boolean));
  el.setAttribute('data-sidebar', 'header');
  return el;
}

export function createSidebarFooter(options: { class?: string } = {}): HTMLElement {
  const el = document.createElement('div');
  el.className = 'nds-sidebar-footer';
  if (options.class) el.classList.add(...options.class.split(' ').filter(Boolean));
  el.setAttribute('data-sidebar', 'footer');
  return el;
}

export function createSidebarGroup(options: SidebarGroupOptions): HTMLElement {
  const group = document.createElement('div');
  group.className = 'nds-sidebar-group';
  group.setAttribute('data-sidebar', 'group');

  if (options.label) {
    const label = document.createElement('div');
    label.className = 'nds-sidebar-group-label';
    label.setAttribute('data-sidebar', 'group-label');
    label.textContent = options.label;
    group.appendChild(label);
  }

  const menu = document.createElement('ul');
  menu.className = 'nds-sidebar-menu';
  menu.setAttribute('data-sidebar', 'menu');
  options.items.forEach(item => menu.appendChild(createSidebarMenuItem(item)));
  group.appendChild(menu);
  return group;
}

export function createSidebarMenuItem(options: SidebarMenuItemOptions): HTMLElement {
  const li = document.createElement('li');
  li.className = 'nds-sidebar-menu-item';
  li.setAttribute('data-sidebar', 'menu-item');

  const isLink = Boolean(options.href);
  const btn = document.createElement(isLink ? 'a' : 'button') as
    | HTMLButtonElement
    | HTMLAnchorElement;

  btn.className = 'nds-sidebar-menu-button';
  btn.setAttribute('data-sidebar', 'menu-button');
  // Ensure accessible name is always present (label may be hidden when collapsed).
  btn.setAttribute('aria-label', options.label);

  if (isLink && btn instanceof HTMLAnchorElement) btn.href = options.href!;
  if (options.active) btn.setAttribute('data-active', 'true');
  if (options.disabled) (btn as HTMLButtonElement).disabled = true;
  if (options.onClick) btn.addEventListener('click', options.onClick);
  if (options.icon) btn.appendChild(options.icon);

  const labelSpan = document.createElement('span');
  labelSpan.textContent = options.label;
  btn.appendChild(labelSpan);

  if (options.badge) {
    const badge = document.createElement('span');
    badge.className = 'nds-sidebar-menu-button-badge';
    badge.textContent = options.badge;
    btn.appendChild(badge);
  }

  li.appendChild(btn);
  return li;
}

export function createSidebarSeparator(options: { class?: string } = {}): HTMLElement {
  const el = document.createElement('div');
  el.className = 'nds-sidebar-separator';
  if (options.class) el.classList.add(...options.class.split(' ').filter(Boolean));
  el.setAttribute('data-sidebar', 'separator');
  el.setAttribute('role', 'separator');
  return el;
}
