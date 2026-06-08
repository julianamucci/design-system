import type { Meta, StoryObj } from '@storybook/svelte';
import { waitForPortal } from '@/lib/wait-for-portal';

import { userEvent, within, expect, waitFor, fn } from 'storybook/test';
import PopoverStory from './PopoverStory.svelte';
import PopoverDocs from '@/components/docs/PopoverDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const meta = {
  title: 'UI/Popover',
  component: PopoverStory,
  tags: ['autodocs', 'overlay'],
  parameters: {
    layout: 'centered',
    docs: {
      page: withAutoDocsTab(PopoverDocs),
      description: {
        component:
          'Popover construído sobre bits-ui. Overlay flutuante ativado por clique, com auto-flip por colisão, role=dialog e foco gerenciado. Sempre forneça PopoverTitle para acessibilidade.',
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
      description: 'Alinhamento do Content ao longo do eixo do side.',
    },
    sideOffset: {
      control: { type: 'number', min: 0, step: 1 },
      description: 'Distância em pixels entre trigger e Content.',
    },
    defaultOpen: {
      control: 'boolean',
      description: 'Estado inicial em modo não-controlado.',
    },
    modal: {
      control: 'boolean',
      description: 'Quando true, trap de foco e bloqueio de scroll.',
    },
    triggerLabel: {
      control: 'text',
      description: 'Texto exibido no trigger (Button).',
    },
    variant: {
      control: 'select',
      options: ['default', 'withTitle', 'form'],
      description: 'Composição interna usada na demonstração.',
    },
  },
  args: {
    side: 'bottom',
    align: 'center',
    sideOffset: 4,
    defaultOpen: false,
    modal: false,
    triggerLabel: 'Abrir popover',
    title: 'Configuracoes de exibição',
    description: 'Ajuste a aparência do conteúdo da página.',
    saveLabel: 'Salvar',
    cancelLabel: 'Cancelar',
    variant: 'withTitle',
    onAction: fn(),
    onCancel: fn(),
  },
} satisfies Meta<typeof PopoverStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);

    const waitForClose = async () => {
      await waitFor(
        () => {
          const dialog = body.queryByRole('dialog');
          if (dialog && dialog.getAttribute('data-state') !== 'closed') {
            throw new Error('popover still open');
          }
        },
        { timeout: 1000 }
      );
    };

    await step('1. Abre ao clicar no trigger', async () => {
      const trigger = canvas.getByRole('button', { name: /Abrir popover/i });
      await expect(trigger).toBeInTheDocument();
      await userEvent.click(trigger);
      const dialog = await waitForPortal('dialog');
      await expect(dialog).toBeVisible();
      await expect(dialog).toHaveAccessibleName(/Configuracoes de exibição/i);
    });

    await step('2. Escape fecha o popover e retorna foco ao trigger', async () => {
      await userEvent.keyboard('{Escape}');
      await waitForClose();
      await waitFor(() => {
        const trigger = canvas.getByRole('button', { name: /Abrir popover/i });
        if (document.activeElement !== trigger) {
          throw new Error('focus did not return to trigger');
        }
      });
    });

    await step('3. Reabrir e fechar via clique fora', async () => {
      const trigger = canvas.getByRole('button', { name: /Abrir popover/i });
      await userEvent.click(trigger);
      await waitForPortal('dialog');
      await userEvent.click(document.body);
      await waitForClose();
    });
  },
};
