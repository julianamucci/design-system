import type { Meta, StoryObj } from '@storybook/svelte';
import { waitForPortal } from '@/lib/wait-for-portal';

import { userEvent, within, expect, waitFor, fn } from 'storybook/test';
import SheetStory from './SheetStory.svelte';
import SheetDocs from '@/components/docs/SheetDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const meta = {
  title: 'UI/Sheet',
  component: SheetStory,
  tags: ['autodocs', 'disclosure'],
  parameters: {
    layout: 'centered',
    docs: {
      page: withAutoDocsTab(SheetDocs),
      description: {
        component:
          'Sheet baseado em bits-ui Dialog. Painel deslizante com 4 sides (top/right/bottom/left), focus trap, Escape para fechar e overlay click.',
      },
    },
  },
  argTypes: {
    side: {
      control: 'inline-radio',
      options: ['top', 'right', 'bottom', 'left'],
      description: 'Lado de onde o painel desliza (prop do SheetContent).',
    },
    showCloseButton: {
      control: 'boolean',
      description: 'Exibe o botão X no canto superior direito do SheetContent.',
    },
  },
  args: {
    side: 'right',
    showCloseButton: true,
    triggerLabel: 'Abrir filtros',
    title: 'Filtros avançados',
    description: 'Configure os filtros para refinar os resultados.',
    actionLabel: 'Aplicar filtros',
    cancelLabel: 'Cancelar',
    onAction: fn(),
    onCancel: fn(),
  },
} satisfies Meta<typeof SheetStory>;

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
            throw new Error('sheet still open');
          }
        },
        { timeout: 1200 }
      );
    };

    await step('1. Abre ao clicar no trigger', async () => {
      const trigger = canvas.getByRole('button', { name: /Abrir filtros/i });
      await expect(trigger).toBeInTheDocument();
      await userEvent.click(trigger);
      const dialog = await waitForPortal('dialog');
      await expect(dialog).toBeVisible();
      await expect(dialog).toHaveAttribute('aria-modal', 'true');
      await expect(dialog).toHaveAccessibleName(/Filtros avançados/i);
    });

    await step('2. Aplica data-side=right', async () => {
      const content = document.querySelector<HTMLElement>('[data-slot="sheet-content"]');
      await expect(content).not.toBeNull();
      await expect(content).toHaveAttribute('data-side', 'right');
    });

    await step('3. Focus trap — foco move para dentro do sheet', async () => {
      const dialog = await waitForPortal('dialog');
      await waitFor(() => {
        if (!dialog.contains(document.activeElement)) throw new Error('focus not trapped');
      });
    });

    await step('4. Escape fecha o sheet', async () => {
      await userEvent.keyboard('{Escape}');
      await waitForClose();
    });

    await step('5. Retorno de foco ao trigger após Escape', async () => {
      await waitFor(() => {
        const trigger = canvas.getByRole('button', { name: /Abrir filtros/i });
        if (document.activeElement !== trigger) throw new Error('focus did not return');
      });
    });

    await step('6. Reabrir e fechar via botão Close (X)', async () => {
      const trigger = canvas.getByRole('button', { name: /Abrir filtros/i });
      await userEvent.click(trigger);
      const dialog = await waitForPortal('dialog');
      const closeBtn = within(dialog).getByRole('button', { name: /close/i });
      await userEvent.click(closeBtn);
      await waitForClose();
    });
  },
};
