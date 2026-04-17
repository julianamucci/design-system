import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

export type MenubarItemType = 'item' | 'separator' | 'label';

export type MenubarItem = {
  type?: MenubarItemType;
  label?: string;
  shortcut?: string;
  onClick?: () => void;
  disabled?: boolean;
  checked?: boolean;
};

export type MenubarMenu = {
  label: string;
  items: MenubarItem[];
};

// ─── Classes ──────────────────────────────────────────────────────────────────

const ROOT_CLASS = 'flex h-9 items-center space-x-1 rounded-md border bg-background p-1 shadow-sm';
const TRIGGER_CLASS =
  'flex cursor-default select-none items-center rounded-sm px-3 py-1 text-sm font-medium outline-none ' +
  'focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground';
const PANEL_CLASS =
  'absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md hidden';
const MENU_ITEM_CLASS =
  'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none ' +
  'focus:bg-accent focus:text-accent-foreground hover:bg-accent hover:text-accent-foreground';
const SEPARATOR_CLASS = '-mx-1 my-1 h-px bg-muted';
const LABEL_CLASS = 'px-2 py-1.5 text-sm font-semibold text-muted-foreground';
const SHORTCUT_CLASS = 'ml-auto text-xs tracking-widest text-muted-foreground opacity-60';

let _menubarCounter = 0;

// ─── createMenubar ────────────────────────────────────────────────────────────

export function createMenubar(menus: MenubarMenu[], options?: { class?: string }): HTMLElement {
  const id = ++_menubarCounter;
  const root = document.createElement('div');
  root.dataset.slot = 'menubar';
  root.setAttribute('role', 'menubar');
  root.className = cn(ROOT_CLASS, options?.class);

  let openMenu: { panel: HTMLElement; trigger: HTMLElement } | null = null;

  function closeAll(): void {
    if (!openMenu) return;
    openMenu.panel.classList.add('hidden');
    openMenu.trigger.dataset.state = 'closed';
    openMenu.trigger.setAttribute('aria-expanded', 'false');
    openMenu = null;
  }

  menus.forEach((menu, menuIdx) => {
    const panelId = `menubar-panel-${id}-${menuIdx}`;
    const itemWrapper = document.createElement('div');
    itemWrapper.style.position = 'relative';

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = TRIGGER_CLASS;
    trigger.setAttribute('role', 'menuitem');
    trigger.setAttribute('aria-haspopup', 'true');
    trigger.setAttribute('aria-controls', panelId);
    trigger.setAttribute('aria-expanded', 'false');
    trigger.dataset.state = 'closed';
    trigger.textContent = menu.label;

    const panel = document.createElement('div');
    panel.id = panelId;
    panel.className = PANEL_CLASS;
    panel.setAttribute('role', 'menu');
    panel.style.top = '100%';
    panel.style.left = '0';
    panel.style.marginTop = '4px';

    const panelItems: HTMLElement[] = [];

    menu.items.forEach((item) => {
      if (item.type === 'separator') {
        const sep = document.createElement('div');
        sep.className = SEPARATOR_CLASS;
        sep.setAttribute('role', 'separator');
        panel.appendChild(sep);
        return;
      }

      if (item.type === 'label') {
        const label = document.createElement('div');
        label.className = LABEL_CLASS;
        label.textContent = item.label ?? '';
        panel.appendChild(label);
        return;
      }

      const itemEl = document.createElement('div');
      itemEl.setAttribute('role', 'menuitem');
      itemEl.setAttribute('tabindex', item.disabled ? '-1' : '0');
      itemEl.className = cn(
        MENU_ITEM_CLASS,
        item.disabled ? 'pointer-events-none opacity-50' : 'cursor-pointer'
      );

      const labelSpan = document.createElement('span');
      labelSpan.textContent = item.label ?? '';
      itemEl.appendChild(labelSpan);

      if (item.shortcut) {
        const shortcut = document.createElement('span');
        shortcut.className = SHORTCUT_CLASS;
        shortcut.textContent = item.shortcut;
        itemEl.appendChild(shortcut);
      }

      if (!item.disabled && item.onClick) {
        itemEl.addEventListener('click', () => {
          item.onClick!();
          closeAll();
        });
        itemEl.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            item.onClick!();
            closeAll();
          }
        });
      }

      panelItems.push(itemEl);
      panel.appendChild(itemEl);
    });

    // Keyboard nav within panel
    panel.addEventListener('keydown', (e) => {
      const focusable = panelItems.filter((el) => el.getAttribute('tabindex') !== '-1');
      const idx = focusable.indexOf(document.activeElement as HTMLElement);
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        focusable[(idx + 1) % focusable.length]?.focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        focusable[(idx - 1 + focusable.length) % focusable.length]?.focus();
      } else if (e.key === 'Escape') {
        closeAll();
        trigger.focus();
      }
    });

    trigger.addEventListener('click', () => {
      const isOpen = trigger.dataset.state === 'open';
      closeAll();
      if (!isOpen) {
        panel.classList.remove('hidden');
        trigger.dataset.state = 'open';
        trigger.setAttribute('aria-expanded', 'true');
        openMenu = { panel, trigger };
        panelItems[0]?.focus();
      }
    });

    // Keyboard: open on ArrowDown
    trigger.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (trigger.dataset.state !== 'open') trigger.click();
        panelItems[0]?.focus();
      }
      if (e.key === 'Escape') closeAll();
    });

    itemWrapper.appendChild(trigger);
    itemWrapper.appendChild(panel);
    root.appendChild(itemWrapper);
  });

  document.addEventListener('click', (e) => {
    if (openMenu && !root.contains(e.target as Node)) closeAll();
  });

  return root;
}
