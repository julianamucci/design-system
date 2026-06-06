import type { Meta, StoryObj } from '@storybook/html';
import { userEvent, within, expect, waitFor } from 'storybook/test';
import { createMenubar } from './menubar';

const meta: Meta = {
  tags: ['navigation'],
  title: 'UI/Menubar/Variantes',
  parameters: {
    actions: { disable: true },
    layout: 'padded',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Variantes do MenubarItem: Default (neutro com hover bg-accent) e Destructive (text-destructive). NOTA: a factory createMenubar (Basecoat) não tem prop `variant` nativo — o item destructive é montado manualmente com classes Tailwind aplicadas no <li role="menuitem">.',
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
  wrapper.className = 'nds-cluster nds-w-full nds-p-2';
  wrapper.dataset.justify = 'center';
  wrapper.style.alignItems = 'flex-start';
  wrapper.style.minHeight = '220px';
  wrapper.appendChild(child);
  return wrapper;
}

async function closeAfter(): Promise<void> {
  await userEvent.keyboard('{Escape}');
  await waitFor(() => {
    if (document.querySelector('[data-slot="menubar"] button[aria-expanded="true"]')) {
      throw new Error('menu ainda aberto');
    }
  });
}

function openFirstMenu(bar: HTMLElement): void {
  queueMicrotask(() => {
    const trigger = bar.querySelector<HTMLButtonElement>('button[aria-haspopup]');
    trigger?.click();
  });
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Default: Story = {
  name: 'Default',
  render: () => {
    const bar = createMenubar([
      {
        label: 'Arquivo',
        items: [
          { type: 'item', label: 'Novo',    shortcut: '⌘N' },
          { type: 'item', label: 'Abrir',   shortcut: '⌘O' },
          { type: 'item', label: 'Salvar',  shortcut: '⌘S' },
        ],
      },
    ]);
    bar.dataset.slot = 'menubar';
    openFirstMenu(bar);
    return wrap(bar);
  },
  play: async ({ step }) => {
    const body = within(document.body);
    await step('Items default visíveis com role=menuitem', async () => {
      await waitFor(async () => {
        const menu = body.queryAllByRole('menu');
        if (!menu.length) throw new Error('menu não aberto');
      });
      const items = document.querySelectorAll('[role="menu"] [role="menuitem"]');
      await expect(items.length).toBe(3);
    });
    await step('Limpa via ESC', closeAfter);
  },
};

export const Destructive: Story = {
  name: 'Destructive',
  render: () => {
    // Factory Basecoat não tem `variant` — adicionamos um item destructive
    // após criar a barra, anexando o <li> manualmente ao panel do menu.
    const bar = createMenubar([
      {
        label: 'Arquivo',
        items: [
          { type: 'item', label: 'Novo',    shortcut: '⌘N' },
          { type: 'separator' },
        ],
      },
    ]);
    bar.dataset.slot = 'menubar';

    // Localiza o panel (filho do trigger wrapper) e injeta item destructive.
    const panel = bar.querySelector<HTMLElement>('[role="menu"]');
    if (panel) {
      const li = document.createElement('div');
      li.setAttribute('role', 'menuitem');
      li.setAttribute('tabindex', '0');
      li.className = [
        'relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors',
        'text-destructive focus:bg-destructive/10 focus:text-destructive hover:bg-destructive/10 hover:text-destructive',
      ].join(' ');
      const text = document.createElement('span');
      text.textContent = 'Excluir arquivo';
      li.appendChild(text);
      panel.appendChild(li);
    }

    openFirstMenu(bar);
    return wrap(bar);
  },
  play: async ({ step }) => {
    await step('Item destructive presente com classe text-destructive', async () => {
      await waitFor(() => {
        const panel = document.querySelector('[role="menu"]:not(.hidden)');
        if (!panel) throw new Error('menu não aberto');
      });
      const items = document.querySelectorAll('[role="menu"]:not(.hidden) [role="menuitem"]');
      const last = items[items.length - 1] as HTMLElement;
      await expect(last).toHaveClass(/text-destructive/);
    });
    await step('Limpa via ESC', closeAfter);
  },
};
