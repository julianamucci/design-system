// ─── Menubar — Vanilla factory standalone ───────────────────────────────────
// Visual: classes .nds-menubar-* (zero Tailwind/basecoat-css).
// Painel oculto via `hidden` attribute; teclado: Arrow/Escape; click fora fecha.

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

let _menubarCounter = 0;

// ─── createMenubar ────────────────────────────────────────────────────────────

export function createMenubar(menus: MenubarMenu[], options?: { class?: string }): HTMLElement {
  const id = ++_menubarCounter;
  const root = document.createElement('div');
  root.dataset.slot = 'menubar';
  root.setAttribute('role', 'menubar');
  root.className = 'nds-menubar';
  if (options?.class) root.classList.add(...options.class.split(' ').filter(Boolean));

  let openMenu: { panel: HTMLElement; trigger: HTMLElement } | null = null;

  function closeAll(): void {
    if (!openMenu) return;
    openMenu.panel.hidden = true;
    openMenu.trigger.dataset.state = 'closed';
    openMenu.trigger.setAttribute('aria-expanded', 'false');
    openMenu = null;
  }

  menus.forEach((menu, menuIdx) => {
    const panelId = `menubar-panel-${id}-${menuIdx}`;
    const itemWrapper = document.createElement('div');
    itemWrapper.className = 'nds-menubar-menu';

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'nds-menubar-trigger';
    trigger.setAttribute('role', 'menuitem');
    trigger.setAttribute('aria-haspopup', 'true');
    trigger.setAttribute('aria-controls', panelId);
    trigger.setAttribute('aria-expanded', 'false');
    trigger.dataset.state = 'closed';
    trigger.textContent = menu.label;

    const panel = document.createElement('div');
    panel.id = panelId;
    panel.className = 'nds-menubar-panel';
    panel.setAttribute('role', 'menu');
    panel.hidden = true;

    const panelItems: HTMLElement[] = [];

    menu.items.forEach((item) => {
      if (item.type === 'separator') {
        const sep = document.createElement('div');
        sep.className = 'nds-menubar-separator';
        sep.setAttribute('role', 'separator');
        panel.appendChild(sep);
        return;
      }

      if (item.type === 'label') {
        const label = document.createElement('div');
        label.className = 'nds-menubar-label';
        label.textContent = item.label ?? '';
        panel.appendChild(label);
        return;
      }

      const itemEl = document.createElement('div');
      itemEl.setAttribute('role', 'menuitem');
      itemEl.setAttribute('tabindex', item.disabled ? '-1' : '0');
      itemEl.className = 'nds-menubar-item';
      if (item.disabled) itemEl.setAttribute('aria-disabled', 'true');

      const labelSpan = document.createElement('span');
      labelSpan.textContent = item.label ?? '';
      itemEl.appendChild(labelSpan);

      if (item.shortcut) {
        const shortcut = document.createElement('span');
        shortcut.className = 'nds-menubar-shortcut';
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
        panel.hidden = false;
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
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && openMenu) closeAll();
  });

  return root;
}
