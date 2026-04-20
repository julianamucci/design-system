import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

export type DropdownMenuItemDef = {
  type?: 'item' | 'separator' | 'label';
  value?: string;
  label?: string;
  disabled?: boolean;
  onClick?: () => void;
};

export type DropdownMenuOptions = {
  trigger: HTMLElement;
  items: DropdownMenuItemDef[];
  onOpenChange?: (open: boolean) => void;
  class?: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

let _dropdownCounter = 0;

function positionDropdown(anchor: HTMLElement, panel: HTMLElement): void {
  const rect = anchor.getBoundingClientRect();
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;
  panel.style.top = `${rect.bottom + scrollY + 4}px`;
  panel.style.left = `${rect.left + scrollX}px`;
}

// ─── createDropdownMenu ───────────────────────────────────────────────────────

export function createDropdownMenu(options: DropdownMenuOptions): HTMLElement {
  const { trigger, items, onOpenChange } = options;

  const id = ++_dropdownCounter;
  const menuId = `dropdown-menu-${id}`;

  let panelEl: HTMLElement | null = null;
  let isOpen = false;

  const wrapper = document.createElement('div');
  wrapper.dataset.slot = 'dropdown-menu';
  wrapper.style.display = 'contents';
  wrapper.appendChild(trigger);

  trigger.setAttribute('aria-haspopup', 'menu');
  trigger.setAttribute('aria-expanded', 'false');
  trigger.setAttribute('aria-controls', menuId);

  function buildMenu(): HTMLElement {
    const menu = document.createElement('ul');
    menu.id = menuId;
    menu.setAttribute('role', 'menu');
    menu.className = cn(
      'z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md',
      options.class
    );
    menu.dataset.slot = 'dropdown-menu-content';
    menu.style.position = 'absolute';

    items.forEach((item) => {
      const type = item.type ?? 'item';

      if (type === 'separator') {
        const sep = document.createElement('li');
        sep.setAttribute('role', 'separator');
        sep.className = '-mx-1 my-1 h-px bg-muted';
        menu.appendChild(sep);
        return;
      }

      if (type === 'label') {
        const lbl = document.createElement('li');
        lbl.setAttribute('role', 'presentation');
        lbl.className = 'px-2 py-1.5 text-xs font-semibold text-muted-foreground';
        lbl.textContent = item.label ?? '';
        menu.appendChild(lbl);
        return;
      }

      // type === 'item'
      const li = document.createElement('li');
      li.setAttribute('role', 'menuitem');
      li.className = cn(
        'relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground',
        item.disabled && 'pointer-events-none opacity-50'
      );
      if (item.disabled) li.setAttribute('aria-disabled', 'true');
      if (!item.disabled) li.setAttribute('tabindex', '-1');
      if (item.value) li.dataset.value = item.value;
      li.textContent = item.label ?? '';

      if (!item.disabled) {
        li.addEventListener('click', () => {
          item.onClick?.();
          close();
        });
        li.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            item.onClick?.();
            close();
          }
        });
      }

      menu.appendChild(li);
    });

    return menu;
  }

  function getMenuItems(menu: HTMLElement): HTMLElement[] {
    return Array.from(menu.querySelectorAll<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])'));
  }

  function open(): void {
    panelEl = buildMenu();
    document.body.appendChild(panelEl);
    positionDropdown(trigger, panelEl);

    trigger.setAttribute('aria-expanded', 'true');
    isOpen = true;

    // Focus first item
    const menuItems = getMenuItems(panelEl);
    menuItems[0]?.focus();

    document.addEventListener('keydown', handleKeydown);
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
    if (!panelEl) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      close();
      trigger.focus();
      return;
    }

    const menuItems = getMenuItems(panelEl);
    const currentIdx = menuItems.indexOf(document.activeElement as HTMLElement);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = currentIdx < menuItems.length - 1 ? currentIdx + 1 : 0;
      menuItems[next]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = currentIdx > 0 ? currentIdx - 1 : menuItems.length - 1;
      menuItems[prev]?.focus();
    } else if (e.key === 'Home') {
      e.preventDefault();
      menuItems[0]?.focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      menuItems[menuItems.length - 1]?.focus();
    } else if (e.key === 'Tab') {
      close();
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
