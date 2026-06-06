import type { Meta, StoryObj } from '@storybook/svelte';
import { waitForPortal } from '@/lib/wait-for-portal';

import { userEvent, within, expect, waitFor, fn } from 'storybook/test';
import DialogStory from './DialogStory.svelte';

const meta = {
  title: 'UI/Dialog/Estados',
  component: DialogStory,
  tags: ['overlay'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Cada configuração canônica do Dialog: closed, open, withCloseButtonHidden e controlled.',
      },
    },
  },
} satisfies Meta<typeof DialogStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Closed: Story = {
  parameters: {
    docs: { description: { story: 'Estado inicial — apenas o trigger é visível, Content não renderizado.' } },
  },
  args: {
    open: false,
    triggerLabel: 'Editar perfil',
    title: 'Editar perfil',
    description: 'Atualize suas informações pessoais.',
    actionLabel: 'Salvar',
    cancelLabel: 'Cancelar',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    const trigger = canvas.getByRole('button', { name: /Editar perfil/i });
    await expect(trigger).toBeVisible();
    await expect(body.queryByRole('dialog')).not.toBeInTheDocument();
  },
};

export const Open: Story = {
  parameters: {
    docs: { description: { story: 'Diálogo aberto. Captura visual no Chromatic.' } },
  },
  args: {
    open: true,
    triggerLabel: 'Editar perfil',
    title: 'Editar perfil',
    description: 'Atualize suas informações pessoais. As mudanças são salvas ao confirmar.',
    actionLabel: 'Salvar alterações',
    cancelLabel: 'Cancelar',
  },
  play: async () => {
    const body = within(document.body);
    const dialog = await waitForPortal('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
  },
};

export const WithCloseButtonHidden: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'showCloseButton={false} no Content. Sem X no canto — fechar apenas por Escape, overlay ou ação do Footer.',
      },
    },
  },
  args: {
    open: true,
    showCloseButton: false,
    triggerLabel: 'Convidar',
    title: 'Convidar para o time',
    description: 'Envie um convite por e-mail.',
    actionLabel: 'Enviar convite',
    cancelLabel: 'Cancelar',
  },
  play: async () => {
    const body = within(document.body);
    const dialog = await waitForPortal('dialog');
    await expect(dialog).toBeVisible();
    // Não há botão "Close" no Content
    const closeBtns = body.queryAllByRole('button', { name: /^Close$/i });
    await expect(closeBtns.length).toBe(0);
  },
};

export const Controlled: Story = {
  parameters: {
    docs: {
      description: { story: 'Abertura controlada externamente via bind:open. Escape fecha mesmo controlado.' },
    },
  },
  args: {
    open: false,
    triggerLabel: 'Abrir via estado externo',
    title: 'Controlado pelo pai',
    description: 'Este diálogo é comandado por estado externo via bind:open.',
    actionLabel: 'Confirmar',
    cancelLabel: 'Cancelar',
    onAction: fn(),
    onCancel: fn(),
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);

    await step('Clique no trigger abre o diálogo', async () => {
      const trigger = canvas.getByRole('button', { name: /Abrir via estado externo/i });
      await userEvent.click(trigger);
      const dialog = await waitForPortal('dialog');
      await expect(dialog).toBeVisible();
    });

    await step('Escape fecha o diálogo controlado', async () => {
      await userEvent.keyboard('{Escape}');
      await waitFor(
        () => {
          const dialog = body.queryByRole('dialog');
          if (dialog && dialog.getAttribute('data-state') !== 'closed') {
            throw new Error('dialog still open');
          }
        },
        { timeout: 500 }
      );
    });
  },
};
