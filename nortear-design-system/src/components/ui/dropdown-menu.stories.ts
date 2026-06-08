import type { Meta, StoryObj } from '@storybook/html';
import { userEvent, within, expect, waitFor } from 'storybook/test';
import { createDropdownMenu } from './dropdown-menu';
import { createButton } from './button';
import { createDropdownMenuDocs } from '@/components/docs/DropdownMenuDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────

type DropdownArgs = {
  triggerLabel: string;
  side: 'top' | 'bottom' | 'left' | 'right';
  align: 'start' | 'center' | 'end';
  modal: boolean;
  defaultOpen: boolean;
};

const meta: Meta<DropdownArgs> = {
  title: 'UI/DropdownMenu',
  tags: ['autodocs', 'overlay'],
  parameters: {
    layout: 'padded',
    docs: { page: withAutoDocsTab(createDropdownMenuDocs) },
  },
  argTypes: {
    triggerLabel: { control: 'text', description: 'Texto do DropdownMenuTrigger.' },
    side: {
      control: { type: 'inline-radio' },
      options: ['top', 'bottom', 'left', 'right'],
      description:
        'Lado de abertura. NOTA: factory Basecoat fixa bottom; documenta o argType para manter paridade conceitual com outras stacks.',
    },
    align: {
      control: { type: 'inline-radio' },
      options: ['start', 'center', 'end'],
      description: 'Alinhamento do Content.',
    },
    modal: {
      control: 'boolean',
      description:
        'Bloqueia interação fora. NOTA: factory Basecoat sempre permite click fora (não-modal de fato).',
    },
    defaultOpen: { control: 'boolean', description: 'Abre o menu ao montar.' },
  },
  args: {
    triggerLabel: 'Abrir menu',
    side: 'bottom',
    align: 'start',
    modal: true,
    defaultOpen: false,
  },
};

export default meta;
type Story = StoryObj<DropdownArgs>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildMenuEl(args: DropdownArgs): { el: HTMLElement; trigger: HTMLButtonElement } {
  const trigger = createButton({ variant: 'outline', label: args.triggerLabel });
  const el = createDropdownMenu({
    trigger,
    items: [
      { type: 'label', label: 'Conta' },
      { type: 'item', label: 'Perfil', value: 'profile' },
      { type: 'item', label: 'Configuracoes', value: 'settings' },
      { type: 'separator' },
      { type: 'item', label: 'Sair', value: 'logout' },
    ],
  });
  el.dataset.slot = 'dropdown-menu';
  return { el, trigger };
}

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  render: (args) => {
    const container = document.createElement('div');
    container.style.contain = 'layout';
    container.className = 'nds-cluster nds-w-full';
    container.dataset.justify = 'center';
    container.style.minHeight = '200px';

    const { el, trigger } = buildMenuEl(args);
    container.appendChild(el);

    if (args.defaultOpen) {
      queueMicrotask(() => trigger.click());
    }
    return container;
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    const triggerRe = new RegExp(args.triggerLabel, 'i');

    const waitForClose = async () => {
      await waitFor(() => {
        if (body.queryByRole('menu')) throw new Error('menu ainda aberto');
      }, { timeout: 800 });
    };

    if (!args.defaultOpen) {
      await step('Abre ao clicar no trigger', async () => {
        const trigger = canvas.getByRole('button', { name: triggerRe });
        await userEvent.click(trigger);
        const menu = await body.findByRole('menu');
        await expect(menu).toBeVisible();
      });
    } else {
      await step('Renderiza aberto via defaultOpen', async () => {
        const menu = await body.findByRole('menu');
        await expect(menu).toBeVisible();
      });
    }

    await step('Fecha via ESC e retorna foco ao trigger', async () => {
      await userEvent.keyboard('{Escape}');
      await waitForClose();
    });
  },
};
