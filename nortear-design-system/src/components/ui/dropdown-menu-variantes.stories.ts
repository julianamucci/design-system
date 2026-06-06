import type { Meta, StoryObj } from '@storybook/html';
import { userEvent, within, expect } from 'storybook/test';
import { createDropdownMenu } from './dropdown-menu';
import { createButton } from './button';

const meta: Meta = {
  tags: ['overlay'],
  title: 'UI/DropdownMenu/Variantes',
  parameters: {
    actions: { disable: true },
    layout: 'padded',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Variantes do DropdownMenuItem: Default (neutro com hover bg-accent) e Destructive (text-destructive). NOTA: factory Basecoat aplica essas variantes via classes manuais no <li> com role="menuitem".',
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
  wrapper.style.minHeight = '180px';
  wrapper.appendChild(child);
  return wrapper;
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Default: Story = {
  name: 'Default',
  render: () => {
    const trigger = createButton({ variant: 'outline', label: 'Ações' });
    const menu = createDropdownMenu({
      trigger,
      items: [
        { type: 'item', label: 'Editar',    value: 'edit'      },
        { type: 'item', label: 'Duplicar',  value: 'duplicate' },
        { type: 'item', label: 'Compartilhar', value: 'share' },
      ],
    });
    queueMicrotask(() => trigger.click());
    return wrap(menu);
  },
  play: async ({ step }) => {
    const body = within(document.body);
    await step('Menu aberto com items default', async () => {
      const menu = await body.findByRole('menu');
      await expect(menu).toBeVisible();
      const items = menu.querySelectorAll('[role="menuitem"]');
      await expect(items.length).toBe(3);
    });
    await step('Limpa via ESC', async () => {
      await userEvent.keyboard('{Escape}');
    });
  },
};

export const Destructive: Story = {
  name: 'Destructive',
  render: () => {
    // A factory atual não tem prop `variant` — montamos um menu manual com
    // as classes destructive aplicadas no item de exclusão.
    const trigger = createButton({ variant: 'outline', label: 'Mais ações' });
    const wrapper = document.createElement('div');
    wrapper.dataset.slot = 'dropdown-menu';
    wrapper.style.display = 'contents';
    wrapper.appendChild(trigger);

    const menuId = 'dropdown-variantes-destructive';
    trigger.setAttribute('aria-haspopup', 'menu');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-controls', menuId);

    let panel: HTMLElement | null = null;

    function close() {
      panel?.remove();
      panel = null;
      trigger.setAttribute('aria-expanded', 'false');
      document.removeEventListener('keydown', onKeydown);
    }
    function onKeydown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
        trigger.focus();
      }
    }
    function open() {
      const menu = document.createElement('ul');
      menu.id = menuId;
      menu.setAttribute('role', 'menu');
      menu.className =
        'z-50 min-w-[10rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md';
      menu.style.position = 'absolute';
      const rect = trigger.getBoundingClientRect();
      menu.style.top = `${rect.bottom + window.scrollY + 4}px`;
      menu.style.left = `${rect.left + window.scrollX}px`;

      function item(label: string, destructive = false): HTMLLIElement {
        const li = document.createElement('li');
        li.setAttribute('role', 'menuitem');
        li.setAttribute('tabindex', '-1');
        li.className = [
          'relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors',
          destructive
            ? 'text-destructive focus:bg-destructive/10 focus:text-destructive'
            : 'focus:bg-accent focus:text-accent-foreground',
        ].join(' ');
        li.textContent = label;
        return li;
      }
      const sep = document.createElement('li');
      sep.setAttribute('role', 'separator');
      sep.className = '-mx-1 my-1 h-px bg-muted';

      menu.append(item('Editar'), item('Duplicar'), sep, item('Excluir', true));
      document.body.appendChild(menu);
      panel = menu;
      trigger.setAttribute('aria-expanded', 'true');
      (menu.querySelector('[role="menuitem"]') as HTMLElement | null)?.focus();
      document.addEventListener('keydown', onKeydown);
    }
    trigger.addEventListener('click', () => (panel ? close() : open()));

    queueMicrotask(() => trigger.click());
    return wrap(wrapper);
  },
  play: async ({ step }) => {
    const body = within(document.body);
    await step('Menu aberto com item destructive', async () => {
      const menu = await body.findByRole('menu');
      const items = menu.querySelectorAll('[role="menuitem"]');
      const last = items[items.length - 1] as HTMLElement;
      await expect(last).toHaveClass(/text-destructive/);
    });
    await step('Limpa via ESC', async () => {
      await userEvent.keyboard('{Escape}');
    });
  },
};
