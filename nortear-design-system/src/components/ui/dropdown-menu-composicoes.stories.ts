import type { Meta, StoryObj } from '@storybook/html';
import { userEvent, within, expect, waitFor } from 'storybook/test';
import { createDropdownMenu } from './dropdown-menu';
import { createButton } from './button';

const meta: Meta = {
  tags: ['overlay'],
  title: 'UI/DropdownMenu/Composicoes',
  parameters: {
    actions: { disable: true },
    layout: 'padded',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Composicoes do DropdownMenu: ComLabel, ComCheckboxItems, ComRadioGroup e ComShortcuts. NOTA: a factory createDropdownMenu (Basecoat) não tem submenu nativo — a composição "ComSubmenu" foi omitida intencionalmente. Para hierarquia, monte o Sub manualmente ou prefira menus planos.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function wrap(child: HTMLElement): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.style.contain = 'layout';
  wrapper.className = 'nds-cluster nds-w-full';
  wrapper.dataset.justify = 'center';
  wrapper.style.minHeight = '220px';
  wrapper.appendChild(child);
  return wrapper;
}

async function closeAfter(): Promise<void> {
  const body = within(document.body);
  await userEvent.keyboard('{Escape}');
  await waitFor(() => {
    if (body.queryByRole('menu')) throw new Error('still open');
  });
}

// Custom factory builder for composições que precisam de roles específicos
// (menuitemcheckbox, menuitemradio, menuitem com shortcut). A factory padrão
// só renderiza role="menuitem" simples.
function buildCustomMenu(
  triggerLabel: string,
  build: (menu: HTMLUListElement) => void,
): HTMLElement {
  const trigger = createButton({ variant: 'outline', label: triggerLabel });
  const wrapper = document.createElement('div');
  wrapper.dataset.slot = 'dropdown-menu';
  wrapper.style.display = 'contents';
  wrapper.appendChild(trigger);

  const menuId = `dropdown-comp-${Math.random().toString(36).slice(2, 8)}`;
  trigger.setAttribute('aria-haspopup', 'menu');
  trigger.setAttribute('aria-expanded', 'false');
  trigger.setAttribute('aria-controls', menuId);

  let panel: HTMLUListElement | null = null;

  function close(): void {
    panel?.remove();
    panel = null;
    trigger.setAttribute('aria-expanded', 'false');
    document.removeEventListener('keydown', onKeydown);
  }
  function onKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
      trigger.focus();
    }
  }
  function open(): void {
    const menu = document.createElement('ul');
    menu.id = menuId;
    menu.setAttribute('role', 'menu');
    menu.className =
      'z-50 min-w-[12rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md';
    menu.style.position = 'absolute';
    const rect = trigger.getBoundingClientRect();
    menu.style.top = `${rect.bottom + window.scrollY + 4}px`;
    menu.style.left = `${rect.left + window.scrollX}px`;
    build(menu);
    document.body.appendChild(menu);
    panel = menu;
    trigger.setAttribute('aria-expanded', 'true');
    (menu.querySelector('[role^="menuitem"]') as HTMLElement | null)?.focus();
    document.addEventListener('keydown', onKeydown);
  }
  trigger.addEventListener('click', () => (panel ? close() : open()));
  queueMicrotask(() => trigger.click());
  return wrapper;
}

function makeLabel(text: string): HTMLLIElement {
  const li = document.createElement('li');
  li.setAttribute('role', 'presentation');
  li.className = 'px-2 py-1.5 text-xs font-semibold text-muted-foreground';
  li.textContent = text;
  return li;
}

function makeSeparator(): HTMLLIElement {
  const li = document.createElement('li');
  li.setAttribute('role', 'separator');
  li.className = '-mx-1 my-1 h-px bg-muted';
  return li;
}

function makeMenuitem(label: string, shortcut?: string): HTMLLIElement {
  const li = document.createElement('li');
  li.setAttribute('role', 'menuitem');
  li.setAttribute('tabindex', '-1');
  li.className =
    'relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground';
  const text = document.createElement('span');
  text.className = 'flex-1';
  text.textContent = label;
  li.appendChild(text);
  if (shortcut) {
    const sc = document.createElement('span');
    sc.className = 'ml-auto text-xs tracking-widest text-muted-foreground';
    sc.setAttribute('aria-hidden', 'true');
    sc.textContent = shortcut;
    li.appendChild(sc);
  }
  return li;
}

function makeCheckboxItem(label: string, checked: boolean): HTMLLIElement {
  const li = document.createElement('li');
  li.setAttribute('role', 'menuitemcheckbox');
  li.setAttribute('aria-checked', String(checked));
  li.setAttribute('tabindex', '-1');
  if (checked) li.dataset.state = 'checked';
  li.className =
    'relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground';
  const indicator = document.createElement('span');
  indicator.className = 'inline-flex w-4 h-4 items-center justify-center';
  indicator.setAttribute('aria-hidden', 'true');
  if (checked) {
    const svgNs = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNs, 'svg');
    svg.setAttribute('width', '14');
    svg.setAttribute('height', '14');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    const path = document.createElementNS(svgNs, 'path');
    path.setAttribute('d', 'M20 6 9 17l-5-5');
    svg.appendChild(path);
    indicator.appendChild(svg);
  }
  const text = document.createElement('span');
  text.textContent = label;
  li.append(indicator, text);
  li.addEventListener('click', () => {
    const next = li.getAttribute('aria-checked') !== 'true';
    li.setAttribute('aria-checked', String(next));
    li.dataset.state = next ? 'checked' : 'unchecked';
  });
  return li;
}

function makeRadioItem(label: string, checked: boolean, group: HTMLUListElement): HTMLLIElement {
  const li = document.createElement('li');
  li.setAttribute('role', 'menuitemradio');
  li.setAttribute('aria-checked', String(checked));
  li.setAttribute('tabindex', '-1');
  if (checked) li.dataset.state = 'checked';
  li.className =
    'relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground';
  const indicator = document.createElement('span');
  indicator.className = 'inline-flex w-4 h-4 items-center justify-center';
  indicator.setAttribute('aria-hidden', 'true');
  if (checked) {
    const svgNs = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNs, 'svg');
    svg.setAttribute('width', '8');
    svg.setAttribute('height', '8');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'currentColor');
    const circle = document.createElementNS(svgNs, 'circle');
    circle.setAttribute('cx', '12');
    circle.setAttribute('cy', '12');
    circle.setAttribute('r', '8');
    svg.appendChild(circle);
    indicator.appendChild(svg);
  }
  const text = document.createElement('span');
  text.textContent = label;
  li.append(indicator, text);
  li.addEventListener('click', () => {
    group.querySelectorAll<HTMLElement>('[role="menuitemradio"]').forEach((el) => {
      el.setAttribute('aria-checked', 'false');
      el.dataset.state = 'unchecked';
    });
    li.setAttribute('aria-checked', 'true');
    li.dataset.state = 'checked';
  });
  return li;
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const ComLabel: Story = {
  name: 'Com Label',
  render: () => {
    const trigger = createButton({ variant: 'outline', label: 'Conta' });
    const menu = createDropdownMenu({
      trigger,
      items: [
        { type: 'label', label: 'Conta' },
        { type: 'item',  label: 'Perfil',         value: 'profile'  },
        { type: 'item',  label: 'Configuracoes',  value: 'settings' },
        { type: 'separator' },
        { type: 'label', label: 'Suporte' },
        { type: 'item',  label: 'Documentação',   value: 'docs'     },
        { type: 'item',  label: 'Sair',           value: 'logout'   },
      ],
    });
    menu.dataset.slot = 'dropdown-menu';
    queueMicrotask(() => trigger.click());
    return wrap(menu);
  },
  play: async ({ step }) => {
    const body = within(document.body);
    await step('Menu com label e separator visíveis', async () => {
      const menu = await body.findByRole('menu');
      const labels = menu.querySelectorAll('[role="presentation"]');
      const seps = menu.querySelectorAll('[role="separator"]');
      await expect(labels.length).toBeGreaterThanOrEqual(2);
      await expect(seps.length).toBeGreaterThanOrEqual(1);
    });
    await step('Limpa via ESC', async () => {
      await closeAfter();
    });
  },
};

export const ComCheckboxItems: Story = {
  name: 'Com Checkbox Items',
  render: () => wrap(
    buildCustomMenu('Mostrar colunas', (menu) => {
      menu.append(
        makeLabel('Colunas visíveis'),
        makeCheckboxItem('Status', true),
        makeCheckboxItem('Email', true),
        makeCheckboxItem('Função', false),
      );
    }),
  ),
  play: async ({ step }) => {
    const body = within(document.body);
    await step('Menu contém menuitemcheckbox', async () => {
      const menu = await body.findByRole('menu');
      const items = menu.querySelectorAll('[role="menuitemcheckbox"]');
      await expect(items.length).toBe(3);
      const firstChecked = items[0].getAttribute('aria-checked');
      await expect(firstChecked).toBe('true');
    });
    await step('Limpa via ESC', async () => {
      await closeAfter();
    });
  },
};

export const ComRadioGroup: Story = {
  name: 'Com Radio Group',
  render: () => wrap(
    buildCustomMenu('Tema', (menu) => {
      const group = menu;
      group.append(
        makeLabel('Aparência'),
        makeRadioItem('Claro', false, group),
        makeRadioItem('Escuro', true, group),
        makeRadioItem('Sistema', false, group),
      );
    }),
  ),
  play: async ({ step }) => {
    const body = within(document.body);
    await step('Menu contém menuitemradio com apenas um checked', async () => {
      const menu = await body.findByRole('menu');
      const items = menu.querySelectorAll('[role="menuitemradio"]');
      await expect(items.length).toBe(3);
      const checked = menu.querySelectorAll('[role="menuitemradio"][aria-checked="true"]');
      await expect(checked.length).toBe(1);
    });
    await step('Limpa via ESC', async () => {
      await closeAfter();
    });
  },
};

export const ComShortcuts: Story = {
  name: 'Com Shortcuts',
  render: () => wrap(
    buildCustomMenu('Editar', (menu) => {
      menu.append(
        makeMenuitem('Desfazer', '⌘Z'),
        makeMenuitem('Refazer', '⇧⌘Z'),
        makeSeparator(),
        makeMenuitem('Recortar', '⌘X'),
        makeMenuitem('Copiar', '⌘C'),
        makeMenuitem('Colar', '⌘V'),
      );
    }),
  ),
  play: async ({ step }) => {
    const body = within(document.body);
    await step('Items exibem shortcut hint visualmente', async () => {
      const menu = await body.findByRole('menu');
      const items = menu.querySelectorAll('[role="menuitem"]');
      await expect(items.length).toBe(5);
      const firstItem = items[0] as HTMLElement;
      const shortcut = firstItem.querySelector('[aria-hidden="true"]');
      await expect(shortcut?.textContent).toMatch(/⌘Z/);
    });
    await step('Limpa via ESC', async () => {
      await closeAfter();
    });
  },
};
