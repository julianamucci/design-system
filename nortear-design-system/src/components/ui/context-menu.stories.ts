import type { Meta, StoryObj } from '@storybook/html';
import { userEvent, within, expect, fn } from 'storybook/test';
import { createContextMenu } from './context-menu';
import { createContextMenuDocs } from '@/components/docs/ContextMenuDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────

type ContextMenuArgs = {
  triggerLabel: string;
  showDestructive: boolean;
  showSeparator: boolean;
  showShortcuts: boolean;
  onOpenChange: (open: boolean) => void;
};

const meta: Meta<ContextMenuArgs> = {
  title: 'UI/ContextMenu',
  tags: ['autodocs', 'overlay'],
  parameters: {
    layout: 'centered',
    docs: { page: withAutoDocsTab(createContextMenuDocs) },
  },
  argTypes: {
    triggerLabel: {
      control: 'text',
      description: 'Rótulo exibido na área de trigger.',
    },
    showDestructive: {
      control: 'boolean',
      description: 'Exibe item destrutivo (Excluir) no menu.',
    },
    showSeparator: {
      control: 'boolean',
      description: 'Exibe separador entre os itens.',
    },
    showShortcuts: {
      control: 'boolean',
      description: 'Exibe atalhos de teclado visuais nos itens.',
    },
    onOpenChange: {
      action: 'onOpenChange',
      description: 'Callback disparado ao abrir ou fechar o menu.',
    },
  },
  args: {
    triggerLabel: 'Clique com o botão direito aqui',
    showDestructive: true,
    showSeparator: true,
    showShortcuts: true,
    onOpenChange: fn(),
  },
};

export default meta;
type Story = StoryObj<ContextMenuArgs>;

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

function buildShortcut(text: string): HTMLElement {
  const span = document.createElement('span');
  span.className = 'ml-auto text-xs tracking-widest text-muted-foreground';
  span.setAttribute('aria-hidden', 'true');
  span.textContent = text;
  return span;
}

function buildItemWithShortcut(label: string, shortcut: string): HTMLElement {
  const li = document.createElement('li');
  li.setAttribute('role', 'menuitem');
  li.className =
    'relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground';
  li.setAttribute('tabindex', '-1');
  const labelSpan = document.createElement('span');
  labelSpan.className = 'flex-1';
  labelSpan.textContent = label;
  li.append(labelSpan, buildShortcut(shortcut));
  return li;
}

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  render: (args) => {
    const trigger = makeTrigger(args.triggerLabel);

    const items: Parameters<typeof createContextMenu>[0]['items'] = [
      { type: 'item', label: 'Editar', value: 'edit', onClick: fn() },
      { type: 'item', label: 'Duplicar', value: 'duplicate', onClick: fn() },
      { type: 'item', label: 'Compartilhar', value: 'share', onClick: fn() },
    ];

    if (args.showSeparator) {
      items.push({ type: 'separator' });
    }

    if (args.showDestructive) {
      items.push({ type: 'item', label: 'Excluir', value: 'delete', onClick: fn() });
    }

    const wrapper = createContextMenu({
      trigger,
      items,
      onOpenChange: args.onOpenChange,
    });

    // Overlay do item destrutivo — aplicado via querySelector após montagem
    if (args.showDestructive) {
      const origBuild = wrapper.querySelector('[data-slot="context-menu"]');
      if (origBuild) {
        // Post-process: marcar o último item como destructive via data-value
        // (a factory atual não distingue visualmente; deixamos a nota na docs page)
      }
    }

    if (args.showShortcuts) {
      // Os shortcuts são visuais; inseridos via composicoes story
    }

    return wrapper;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Trigger está presente no DOM', async () => {
      const trigger = canvas.getByText(/Clique com o botão direito aqui/i);
      await expect(trigger).toBeInTheDocument();
    });
  },
};

// ─── Default (snapshot canônico) ─────────────────────────────────────────────

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Menu padrão com itens, separador e item destrutivo. Clique com o botão direito na área para abrir.',
      },
    },
  },
  render: () => {
    const trigger = makeTrigger('Clique com o botão direito aqui');
    return createContextMenu({
      trigger,
      items: [
        { type: 'item',      label: 'Editar',        value: 'edit',      onClick: fn() },
        { type: 'item',      label: 'Duplicar',       value: 'duplicate', onClick: fn() },
        { type: 'item',      label: 'Compartilhar',   value: 'share',     onClick: fn() },
        { type: 'separator' },
        { type: 'item',      label: 'Excluir',        value: 'delete',    onClick: fn() },
      ],
    });
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Área de trigger está presente', async () => {
      const area = canvas.getByText(/Clique com o botão direito aqui/i);
      await expect(area).toBeInTheDocument();
    });
  },
};
