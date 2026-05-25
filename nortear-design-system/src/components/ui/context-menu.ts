// ─── ContextMenu — Vanilla factory standalone ───────────────────────────────
// Visual: reusa classes .nds-dropdown-menu-* (idêntico ao DropdownMenu).
// Trigger via evento contextmenu (botão direito) com coordenadas livres.

// ─── Types ────────────────────────────────────────────────────────────────────

export type ContextMenuItemDef = {
  type?: 'item' | 'separator' | 'label';
  value?: string;
  label?: string;
  disabled?: boolean;
  onClick?: () => void;
};

export type ContextMenuOptions = {
  trigger: HTMLElement;
  items: ContextMenuItemDef[];
  onOpenChange?: (open: boolean) => void;
  class?: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

let _contextMenuCounter = 0;

// ─── createContextMenu ────────────────────────────────────────────────────────

export function createContextMenu(options: ContextMenuOptions): HTMLElement {
  const { trigger, items, onOpenChange } = options;

  const id = ++_contextMenuCounter;
  const menuId = `context-menu-${id}`;

  let panelEl: HTMLElement | null = null;
  let isOpen = false;

  const wrapper = document.createElement('div');
  wrapper.dataset.slot = 'context-menu';
  wrapper.style.display = 'contents';
  wrapper.appendChild(trigger);

  function buildMenu(): HTMLElement {
    const menu = document.createElement('ul');
    menu.id = menuId;
    menu.setAttribute('role', 'menu');
    menu.className = 'nds-dropdown-menu-content';
    if (options.class) menu.classList.add(...options.class.split(' ').filter(Boolean));
    menu.dataset.slot = 'context-menu-content';

    items.forEach((item) => {
      const type = item.type ?? 'item';

      if (type === 'separator') {
        const sep = document.createElement('li');
        sep.setAttribute('role', 'separator');
        sep.className = 'nds-dropdown-menu-separator';
        menu.appendChild(sep);
        return;
      }

      if (type === 'label') {
        const lbl = document.createElement('li');
        lbl.setAttribute('role', 'presentation');
        lbl.className = 'nds-dropdown-menu-label';
        lbl.textContent = item.label ?? '';
        menu.appendChild(lbl);
        return;
      }

      const li = document.createElement('li');
      li.setAttribute('role', 'menuitem');
      li.className = 'nds-dropdown-menu-item';
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

  function open(x: number, y: number): void {
    panelEl = buildMenu();
    panelEl.style.top = `${y + window.scrollY}px`;
    panelEl.style.left = `${x + window.scrollX}px`;
    document.body.appendChild(panelEl);

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

  trigger.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    if (isOpen) close();
    open(e.clientX, e.clientY);
  });

  return wrapper;
}
