import type { Meta, StoryObj } from '@storybook/html';
import { within, expect, fn } from 'storybook/test';
import { createContextMenu } from './context-menu';

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta = {
  tags: ['overlay'],
  title: 'UI/ContextMenu/Estados',
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      description: {
        component:
          'Estados canônicos do ContextMenu: item disabled, item inset e item destrutivo.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeTrigger(label: string): HTMLElement {
  const el = document.createElement('div');
  el.className =
    'nds-cluster nds-rounded-md nds-text-body nds-text-muted-foreground nds-cursor-default';
  el.dataset.justify = 'center';
  el.style.width = '300px';
  el.style.height = '150px';
  el.style.border = '1px dashed hsl(var(--border))';
  el.style.userSelect = 'none';
  el.textContent = label;
  return el;
}

// ─── ItemDisabled ─────────────────────────────────────────────────────────────

export const ItemDisabled: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Item com `disabled: true` — opacidade 50%, `pointer-events-none` e `aria-disabled="true"`. Não recebe foco via teclado.',
      },
    },
  },
  render: () => {
    return createContextMenu({
      trigger: makeTrigger('Clique com o botão direito — Disabled'),
      items: [
        { type: 'item', label: 'Editar',      value: 'edit',      onClick: fn() },
        { type: 'item', label: 'Duplicar',    value: 'duplicate', disabled: true },
        { type: 'item', label: 'Compartilhar',value: 'share',     onClick: fn() },
        { type: 'separator' },
        { type: 'item', label: 'Excluir',     value: 'delete',    disabled: true },
      ],
    });
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Trigger presente no DOM', async () => {
      const trigger = canvas.getByText(/Clique com o botão direito — Disabled/i);
      await expect(trigger).toBeInTheDocument();
    });
  },
};

// ─── ItemInset ────────────────────────────────────────────────────────────────

export const ItemInset: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Item com padding-left extra (inset) para alinhar com itens que possuem ícone à esquerda. Aplicado via `pl-8` no item.',
      },
    },
  },
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.style.display = 'contents';

    const t = makeTrigger('Clique com o botão direito — Inset');

    const menu = document.createElement('ul');
    menu.setAttribute('role', 'menu');
    menu.className =
      'z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md';
    menu.dataset.slot = 'context-menu-content';
    menu.style.position = 'absolute';
    menu.style.display = 'none';

    // Label normal
    const lbl = document.createElement('li');
    lbl.setAttribute('role', 'presentation');
    lbl.className = 'px-2 py-1.5 text-xs font-semibold text-muted-foreground';
    lbl.textContent = 'Ações';
    menu.appendChild(lbl);

    // Item com ícone (não inset) — SVG criado via DOM para evitar innerHTML dinâmico
    const itemWithIcon = document.createElement('li');
    itemWithIcon.setAttribute('role', 'menuitem');
    itemWithIcon.className =
      'relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground';
    itemWithIcon.setAttribute('tabindex', '-1');

    const editSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    editSvg.setAttribute('width', '14');
    editSvg.setAttribute('height', '14');
    editSvg.setAttribute('viewBox', '0 0 24 24');
    editSvg.setAttribute('fill', 'none');
    editSvg.setAttribute('stroke', 'currentColor');
    editSvg.setAttribute('stroke-width', '2');
    editSvg.setAttribute('stroke-linecap', 'round');
    editSvg.setAttribute('stroke-linejoin', 'round');
    const editPath1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    editPath1.setAttribute('d', 'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7');
    const editPath2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    editPath2.setAttribute('d', 'M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z');
    editSvg.append(editPath1, editPath2);

    const editLabel = document.createElement('span');
    editLabel.textContent = 'Editar';

    itemWithIcon.append(editSvg, editLabel);
    menu.appendChild(itemWithIcon);

    // Item inset (sem ícone mas com padding extra para alinhar)
    const itemInset = document.createElement('li');
    itemInset.setAttribute('role', 'menuitem');
    itemInset.className =
      'relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 pl-8 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground';
    itemInset.setAttribute('tabindex', '-1');
    itemInset.textContent = 'Duplicar (inset)';
    menu.appendChild(itemInset);

    const sep = document.createElement('li');
    sep.setAttribute('role', 'separator');
    sep.className = '-mx-1 my-1 h-px bg-muted';
    menu.appendChild(sep);

    // Item destrutivo
    const itemDestructive = document.createElement('li');
    itemDestructive.setAttribute('role', 'menuitem');
    itemDestructive.className =
      'relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 pl-8 text-sm outline-none transition-colors text-destructive focus:bg-destructive/10 focus:text-destructive';
    itemDestructive.setAttribute('tabindex', '-1');
    itemDestructive.textContent = 'Excluir (inset)';
    menu.appendChild(itemDestructive);

    document.body.appendChild(menu);

    let isOpen = false;

    function closeMenu() {
      menu.style.display = 'none';
      isOpen = false;
      document.removeEventListener('click', onOutside);
    }

    function onOutside(e: MouseEvent) {
      if (!menu.contains(e.target as Node) && !t.contains(e.target as Node)) {
        closeMenu();
      }
    }

    t.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      if (isOpen) closeMenu();
      menu.style.top  = `${e.clientY + window.scrollY}px`;
      menu.style.left = `${e.clientX + window.scrollX}px`;
      menu.style.display = 'block';
      isOpen = true;
      setTimeout(() => document.addEventListener('click', onOutside), 0);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen) closeMenu();
    });

    wrapper.appendChild(t);
    return wrapper;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Trigger presente no DOM', async () => {
      const trigger = canvas.getByText(/Clique com o botão direito — Inset/i);
      await expect(trigger).toBeInTheDocument();
    });
  },
};

// ─── ItemDestructive ──────────────────────────────────────────────────────────

export const ItemDestructive: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Item destrutivo com `text-destructive focus:bg-destructive/10 focus:text-destructive` — separado dos outros por um Separator.',
      },
    },
  },
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.style.display = 'contents';

    const t = makeTrigger('Clique com o botão direito — Destructive');

    const menu = document.createElement('ul');
    menu.setAttribute('role', 'menu');
    menu.className =
      'z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md';
    menu.dataset.slot = 'context-menu-content';
    menu.style.position = 'absolute';
    menu.style.display = 'none';

    function makeItem(label: string, destructive = false): HTMLLIElement {
      const li = document.createElement('li');
      li.setAttribute('role', 'menuitem');
      li.className = [
        'relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors',
        destructive
          ? 'text-destructive focus:bg-destructive/10 focus:text-destructive'
          : 'focus:bg-accent focus:text-accent-foreground',
      ].join(' ');
      li.setAttribute('tabindex', '-1');
      li.textContent = label;
      return li;
    }

    const sep = document.createElement('li');
    sep.setAttribute('role', 'separator');
    sep.className = '-mx-1 my-1 h-px bg-muted';

    menu.append(
      makeItem('Editar'),
      makeItem('Duplicar'),
      makeItem('Compartilhar'),
      sep,
      makeItem('Excluir', true),
    );

    document.body.appendChild(menu);

    let isOpen = false;

    function closeMenu() {
      menu.style.display = 'none';
      isOpen = false;
      document.removeEventListener('click', onOutside);
    }

    function onOutside(e: MouseEvent) {
      if (!menu.contains(e.target as Node) && !t.contains(e.target as Node)) {
        closeMenu();
      }
    }

    t.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      if (isOpen) closeMenu();
      menu.style.top  = `${e.clientY + window.scrollY}px`;
      menu.style.left = `${e.clientX + window.scrollX}px`;
      menu.style.display = 'block';
      isOpen = true;
      setTimeout(() => document.addEventListener('click', onOutside), 0);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen) closeMenu();
    });

    wrapper.appendChild(t);
    return wrapper;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Trigger presente no DOM', async () => {
      const trigger = canvas.getByText(/Clique com o botão direito — Destructive/i);
      await expect(trigger).toBeInTheDocument();
    });
  },
};
