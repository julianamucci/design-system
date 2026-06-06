import type { Meta, StoryObj } from '@storybook/svelte';
import { waitForPortal } from '@/lib/wait-for-portal';

import { userEvent, within, expect, waitFor, fn } from 'storybook/test';
import SheetStory from './SheetStory.svelte';

const meta = {
  title: 'UI/Sheet/Estados',
  component: SheetStory,
  tags: ['disclosure'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Estados canônicos do Sheet: closed (inicial), open, withCloseButtonHidden e controlled (bind:open).',
      },
    },
  },
} satisfies Meta<typeof SheetStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Closed: Story = {
  args: {
    triggerLabel: 'Abrir filtros',
    title: 'Filtros avançados',
    description: 'Configure os filtros para refinar os resultados.',
  },
  parameters: {
    docs: {
      description: { story: 'Estado inicial — apenas o trigger é visível, SheetContent não renderizado.' },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    const trigger = canvas.getByRole('button', { name: /Abrir filtros/i });
    await expect(trigger).toBeVisible();
    await expect(body.queryByRole('dialog')).not.toBeInTheDocument();
  },
};

export const Open: Story = {
  args: {
    open: true,
    side: 'right',
    triggerLabel: 'Abrir filtros',
    title: 'Filtros avançados',
    description: 'Configure os filtros para refinar os resultados.',
    actionLabel: 'Aplicar filtros',
    cancelLabel: 'Cancelar',
  },
  parameters: {
    docs: { description: { story: 'Sheet aberto via bind:open. Captura visual no Chromatic.' } },
  },
  play: async () => {
    const body = within(document.body);
    const dialog = await waitForPortal('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
  },
};

export const WithCloseButtonHidden: Story = {
  args: {
    open: true,
    side: 'right',
    showCloseButton: false,
    triggerLabel: 'Convidar',
    title: 'Convidar para o time',
    description: 'Envie um convite por e-mail.',
    actionLabel: 'Enviar convite',
    cancelLabel: 'Cancelar',
  },
  parameters: {
    docs: {
      description: {
        story:
          'showCloseButton={false} no SheetContent. Sem X no canto — fechar apenas via Escape, overlay ou ação do Footer.',
      },
    },
  },
  play: async () => {
    const body = within(document.body);
    const dialog = await waitForPortal('dialog');
    await expect(dialog).toBeVisible();
    const closeBtns = body.queryAllByRole('button', { name: /^Close$/i });
    await expect(closeBtns.length).toBe(0);
  },
};

export const Controlled: Story = {
  args: {
    open: false,
    triggerLabel: 'Abrir via estado externo',
    title: 'Controlado pelo pai',
    description: 'Este sheet é comandado por estado externo via bind:open.',
    actionLabel: 'Confirmar',
    cancelLabel: 'Cancelar',
    onAction: fn(),
    onCancel: fn(),
  },
  parameters: {
    docs: {
      description: { story: 'Abertura controlada externamente via bind:open. Escape fecha mesmo controlado.' },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);

    await step('Clique no trigger abre o sheet', async () => {
      const trigger = canvas.getByRole('button', { name: /Abrir via estado externo/i });
      await userEvent.click(trigger);
      const dialog = await waitForPortal('dialog');
      await expect(dialog).toBeVisible();
    });

    await step('Escape fecha o sheet controlado', async () => {
      await userEvent.keyboard('{Escape}');
      await waitFor(
        () => {
          const dialog = body.queryByRole('dialog');
          if (dialog && dialog.getAttribute('data-state') !== 'closed') {
            throw new Error('sheet still open');
          }
        },
        { timeout: 1200 }
      );
    });
  },
};
