import type { Meta, StoryObj } from '@storybook/html';
import { userEvent, within, expect, waitFor } from 'storybook/test';
import { createMenubar } from './menubar';
import { createMenubarDocs } from '@/components/docs/MenubarDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────

type MenubarArgs = {
  loop: boolean;
  defaultOpen: boolean;
  side: 'top' | 'bottom' | 'left' | 'right';
  align: 'start' | 'center' | 'end';
};

const meta: Meta<MenubarArgs> = {
  title: 'UI/Menubar',
  tags: ['autodocs', 'navigation'],
  parameters: {
    layout: 'padded',
    docs: { page: withAutoDocsTab(createMenubarDocs) },
  },
  argTypes: {
    loop: {
      control: 'boolean',
      description:
        'Loop de navegação por setas entre Triggers. NOTA: factory Basecoat não implementa loop nativo; argType é informativo (paridade conceitual com base-ui/reka-ui/bits-ui).',
    },
    defaultOpen: {
      control: 'boolean',
      description: 'Abre o primeiro menu (Arquivo) ao montar.',
    },
    side: {
      control: { type: 'inline-radio' },
      options: ['top', 'bottom', 'left', 'right'],
      description:
        'Lado de abertura do Content. NOTA: factory Basecoat fixa bottom; argType para paridade.',
    },
    align: {
      control: { type: 'inline-radio' },
      options: ['start', 'center', 'end'],
      description:
        'Alinhamento horizontal do Content. NOTA: factory Basecoat fixa start; argType para paridade.',
    },
  },
  args: {
    loop: true,
    defaultOpen: false,
    side: 'bottom',
    align: 'start',
  },
};

export default meta;
type Story = StoryObj<MenubarArgs>;

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  render: (args) => {
    const container = document.createElement('div');
    container.style.contain = 'layout';
    container.className = 'nds-cluster nds-w-full nds-p-2';
    container.dataset.justify = 'center';
    container.style.alignItems = 'flex-start';
    container.style.minHeight = '260px';

    const bar = createMenubar([
      {
        label: 'Arquivo',
        items: [
          { type: 'item', label: 'Novo',     shortcut: '⌘N' },
          { type: 'item', label: 'Abrir',    shortcut: '⌘O' },
          { type: 'item', label: 'Salvar',   shortcut: '⌘S' },
          { type: 'separator' },
          { type: 'item', label: 'Sair',     shortcut: '⌘Q' },
        ],
      },
      {
        label: 'Editar',
        items: [
          { type: 'item', label: 'Desfazer', shortcut: '⌘Z' },
          { type: 'item', label: 'Refazer',  shortcut: '⇧⌘Z' },
          { type: 'separator' },
          { type: 'item', label: 'Recortar', shortcut: '⌘X' },
          { type: 'item', label: 'Copiar',   shortcut: '⌘C' },
          { type: 'item', label: 'Colar',    shortcut: '⌘V' },
        ],
      },
      {
        label: 'Exibir',
        items: [
          { type: 'label', label: 'Aparência' },
          { type: 'item',  label: 'Modo escuro' },
          { type: 'item',  label: 'Mostrar barra lateral' },
          { type: 'separator' },
          { type: 'item',  label: 'Tela cheia', shortcut: 'F11' },
        ],
      },
      {
        label: 'Ferramentas',
        items: [
          { type: 'item', label: 'Buscar',     shortcut: '⌘F' },
          { type: 'item', label: 'Substituir', shortcut: '⌘H' },
          { type: 'separator' },
          { type: 'item', label: 'Preferências', shortcut: '⌘,' },
        ],
      },
    ]);
    bar.dataset.slot = 'menubar';
    container.appendChild(bar);

    if (args.defaultOpen) {
      queueMicrotask(() => {
        const trigger = bar.querySelector<HTMLButtonElement>('button[aria-haspopup]');
        trigger?.click();
      });
    }
    return container;
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);

    const waitForClose = async () => {
      await waitFor(() => {
        const open = canvasElement.querySelector('button[aria-expanded="true"]');
        if (open) throw new Error('menu ainda aberto');
      }, { timeout: 800 });
    };

    if (!args.defaultOpen) {
      await step('Foca primeiro Trigger e abre via click', async () => {
        const trigger = canvas.getByRole('menuitem', { name: /arquivo/i });
        await userEvent.click(trigger);
        await waitFor(() => {
          if (trigger.getAttribute('aria-expanded') !== 'true') {
            throw new Error('Trigger não abriu');
          }
        });
      });
    } else {
      await step('Renderiza com menu Arquivo aberto via defaultOpen', async () => {
        const trigger = canvas.getByRole('menuitem', { name: /arquivo/i });
        await waitFor(() => {
          if (trigger.getAttribute('aria-expanded') !== 'true') {
            throw new Error('Trigger não abriu');
          }
        });
      });
    }

    await step('ESC fecha o menu', async () => {
      await userEvent.keyboard('{Escape}');
      await waitForClose();
    });

    // Mantém referência usada para evitar lint sem uso em body
    void body;
  },
};
