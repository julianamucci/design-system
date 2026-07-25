// ─── Sidebar ─────────────────────────────────────────────────────────────────
import { createButton } from './button';

const SIDEBAR_WIDTH = '16rem';
const SIDEBAR_WIDTH_ICON = '3rem';
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
  wrapper.className = 'group/sidebar-wrapper flex min-h-svh w-full';
  wrapper.style.setProperty('--sidebar-width', SIDEBAR_WIDTH);
  wrapper.style.setProperty('--sidebar-width-icon', SIDEBAR_WIDTH_ICON);
  if (options.children) wrapper.appendChild(options.children);
  return wrapper;
}

export function createSidebar(options: SidebarOptions = {}): SidebarInstance {
  const { defaultOpen = true, side = 'left', variant = 'sidebar', onOpenChange } = options;
  let isOpen = defaultOpen;

  const root = document.createElement('div');
  root.setAttribute('data-state', isOpen ? 'expanded' : 'collapsed');
  root.setAttribute('data-side', side);
  root.setAttribute('data-variant', variant);

  const gap = document.createElement('div');
  gap.className = 'group peer hidden md:block text-sidebar-foreground';
  gap.setAttribute('data-state', isOpen ? 'expanded' : 'collapsed');

  const gapInner = document.createElement('div');
  gapInner.className =
    'duration-200 relative h-svh w-[--sidebar-width] transition-[width] ease-linear ' +
    'group-data-[state=collapsed]:w-[--sidebar-width-icon]';
  gap.appendChild(gapInner);

  const borderClass =
    side === 'left' && variant === 'sidebar'
      ? 'border-r border-sidebar-border'
      : side === 'right' && variant === 'sidebar'
        ? 'border-l border-sidebar-border'
        : '';

  const panel = document.createElement('div');
  panel.className = [
    'duration-200 fixed inset-y-0 z-10 hidden h-svh w-[--sidebar-width]',
    'transition-[left,right,width] ease-linear md:flex',
    side === 'left' ? 'left-0' : 'right-0',
    borderClass,
    'group-data-[state=collapsed]:w-[--sidebar-width-icon]',
  ]
    .filter(Boolean)
    .join(' ');

  const inner = document.createElement('div');
  inner.className = 'sidebar flex h-full w-full flex-col bg-sidebar';
  inner.setAttribute('data-sidebar', 'sidebar');
  panel.appendChild(inner);
  root.append(gap, panel);

  function setState(open: boolean) {
    isOpen = open;
    const state = open ? 'expanded' : 'collapsed';
    root.setAttribute('data-state', state);
    gap.setAttribute('data-state', state);
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
  // PanelLeft icon
  btn.innerHTML =
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"' +
    ' fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"' +
    ' stroke-linejoin="round" aria-hidden="true">' +
    '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/></svg>';
  btn.addEventListener('click', toggleFn);
  return btn;
}

export function createSidebarContent(options: { class?: string } = {}): HTMLElement {
  const el = document.createElement('div');
  el.className = ['flex min-h-0 flex-1 flex-col gap-2 overflow-auto', options.class ?? '']
    .join(' ')
    .trim();
  el.setAttribute('data-sidebar', 'content');
  return el;
}

export function createSidebarHeader(options: { class?: string } = {}): HTMLElement {
  const el = document.createElement('div');
  el.className = ['flex flex-col gap-2 p-2', options.class ?? ''].join(' ').trim();
  el.setAttribute('data-sidebar', 'header');
  return el;
}

export function createSidebarFooter(options: { class?: string } = {}): HTMLElement {
  const el = document.createElement('div');
  el.className = ['flex flex-col gap-2 p-2', options.class ?? ''].join(' ').trim();
  el.setAttribute('data-sidebar', 'footer');
  return el;
}

export function createSidebarGroup(options: SidebarGroupOptions): HTMLElement {
  const group = document.createElement('div');
  group.className = 'relative flex w-full min-w-0 flex-col p-2';
  group.setAttribute('data-sidebar', 'group');

  if (options.label) {
    const label = document.createElement('div');
    label.className =
      'flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium text-sidebar-foreground/70';
    label.setAttribute('data-sidebar', 'group-label');
    label.textContent = options.label;
    group.appendChild(label);
  }

  const menu = document.createElement('ul');
  menu.className = 'flex w-full min-w-0 flex-col gap-1';
  menu.setAttribute('data-sidebar', 'menu');
  options.items.forEach(item => menu.appendChild(createSidebarMenuItem(item)));
  group.appendChild(menu);
  return group;
}

export function createSidebarMenuItem(options: SidebarMenuItemOptions): HTMLElement {
  const li = document.createElement('li');
  li.className = 'group/menu-item relative';
  li.setAttribute('data-sidebar', 'menu-item');

  const isLink = Boolean(options.href);
  const btn = document.createElement(isLink ? 'a' : 'button') as
    | HTMLButtonElement
    | HTMLAnchorElement;

  btn.className = [
    'peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2',
    'text-left text-sm outline-none ring-sidebar-ring transition-colors',
    'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
    'focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50',
    'data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground',
    '[&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0',
  ].join(' ');
  btn.setAttribute('data-sidebar', 'menu-button');

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
    badge.className = 'ml-auto';
    badge.textContent = options.badge;
    btn.appendChild(badge);
  }

  li.appendChild(btn);
  return li;
}

export function createSidebarSeparator(options: { class?: string } = {}): HTMLElement {
  const el = document.createElement('div');
  el.className = ['mx-2 w-auto bg-sidebar-border h-[1px]', options.class ?? ''].join(' ').trim();
  el.setAttribute('data-sidebar', 'separator');
  el.setAttribute('role', 'separator');
  return el;
}

