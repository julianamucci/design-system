import type { Meta, StoryObj } from '@storybook/svelte';
import { waitForPortal } from '@/lib/wait-for-portal';

import { userEvent, within, expect, waitFor } from 'storybook/test';
import TooltipStory from './TooltipStory.svelte';
import TooltipDocs from '@/components/docs/TooltipDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const meta = {
  title: 'UI/Tooltip',
  component: TooltipStory,
  tags: ['autodocs', 'overlay'],
  parameters: {
    layout: 'centered',
    docs: {
      page: withAutoDocsTab(TooltipDocs),
      description: {
        component:
          'Tooltip construído sobre bits-ui. Texto explicativo curto exibido em hover OU foco (WCAG 1.4.13). TooltipProvider é obrigatório no root. Tooltip não substitui aria-label em botões icon-only.',
      },
    },
  },
  argTypes: {
    side: {
      control: 'inline-radio',
      options: ['top', 'bottom', 'left', 'right'],
      description: 'Lado preferido do Content em relação ao trigger.',
    },
    align: {
      control: 'inline-radio',
      options: ['start', 'center', 'end'],
      description: 'Alinhamento ao longo do eixo do side.',
    },
    sideOffset: {
      control: { type: 'number', min: 0, step: 1 },
      description: 'Distância em pixels entre trigger e Content.',
    },
    delayDuration: {
      control: { type: 'number', min: 0, step: 50 },
      description: 'Delay em ms antes de abrir no hover (aplicado no Provider).',
    },
    defaultOpen: {
      control: 'boolean',
      description: 'Estado inicial em modo não-controlado.',
    },
    variant: {
      control: 'select',
      options: ['default', 'withShortcut', 'longText'],
      description: 'Composição interna do TooltipContent.',
    },
    triggerLabel: { control: 'text', description: 'Rótulo lógico do trigger (usado para selecionar ícone).' },
    ariaLabel: { control: 'text', description: 'aria-label do botão icon-only (obrigatório).' },
    contentText: { control: 'text', description: 'Texto exibido dentro do TooltipContent.' },
  },
  args: {
    side: 'top',
    align: 'center',
    sideOffset: 4,
    delayDuration: 0,
    defaultOpen: false,
    variant: 'default',
    triggerLabel: 'Salvar',
    ariaLabel: 'Salvar',
    contentText: 'Salvar (Ctrl+S)',
  },
} satisfies Meta<typeof TooltipStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);

    const waitForClose = async () => {
      await waitFor(
        () => {
          const tip = body.queryByRole('tooltip');
          if (tip && tip.getAttribute('data-state') !== 'closed') {
            throw new Error('tooltip still open');
          }
        },
        { timeout: 2000 }
      );
    };

    await step('1. Trigger renderiza como botão com aria-label', async () => {
      const trigger = canvas.getByRole('button', { name: /salvar/i });
      await expect(trigger).toBeInTheDocument();
      await expect(trigger).toHaveAttribute('aria-label');
    });

    await step('2. Foco abre o tooltip (WCAG 1.4.13)', async () => {
      const trigger = canvas.getByRole('button', { name: /salvar/i });
      trigger.focus();
      const tip = await waitForPortal('tooltip', { timeout: 2000 });
      await expect(tip).toBeVisible();
    });

    await step('3. ESC fecha o tooltip', async () => {
      await userEvent.keyboard('{Escape}');
      await waitForClose();
    });
  },
};
