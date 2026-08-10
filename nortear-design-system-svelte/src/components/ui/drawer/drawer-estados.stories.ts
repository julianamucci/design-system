import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { waitForPortal } from '@/lib/wait-for-portal';

import { userEvent, within, expect, waitFor, fn } from 'storybook/test';
import DrawerStory from './DrawerStory.svelte';

const meta: Meta = {
  title: 'UI/Drawer/States',
  component: DrawerStory,
  tags: ['disclosure'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Estados canônicos do Drawer: fechado, aberto (defaultOpen), controlado e não-dismissible.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Closed: Story = {
  args: {
    defaultOpen: false,
    triggerLabel: 'Abrir drawer',
    title: 'Editar perfil',
    description: 'Atualize seus dados pessoais.',
  },
  parameters: {
    docs: { description: { story: 'Estado inicial — apenas o trigger é renderizado; portal vazio.' } },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    const trigger = canvas.getByRole('button', { name: /Abrir drawer/i });
    await expect(trigger).toBeVisible();
    await expect(body.queryByRole('dialog')).not.toBeInTheDocument();
  },
};

export const Open: Story = {
  args: {
    defaultOpen: true,
    triggerLabel: 'Editar perfil',
    title: 'Editar perfil',
    description: 'Atualize seus dados pessoais e foto.',
    actionLabel: 'Salvar',
    cancelLabel: 'Cancelar',
  },
  parameters: {
    docs: { description: { story: 'Drawer aberto via defaultOpen=true. Captura visual no Chromatic.' } },
  },
  play: async () => {
    const dialog = await waitForPortal('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
  },
};

export const Controlled: Story = {
  args: {
    open: false,
    triggerLabel: 'Abrir via estado externo',
    title: 'Controlado pelo pai',
    description: 'Este drawer é comandado por estado externo via bind:open.',
    actionLabel: 'Confirmar',
    cancelLabel: 'Cancelar',
    onAction: fn(),
    onCancel: fn(),
  },
  parameters: {
    docs: { description: { story: 'Abertura controlada externamente via open + onOpenChange (bind:open).' } },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);

    await step('Clique no trigger abre o drawer', async () => {
      const trigger = canvas.getByRole('button', { name: /Abrir via estado externo/i });
      await userEvent.click(trigger);
      const dialog = await waitForPortal('dialog');
      await expect(dialog).toBeVisible();
    });

    await step('Escape fecha o drawer controlado', async () => {
      await userEvent.keyboard('{Escape}');
      await waitFor(
        () => {
          const dialog = body.queryByRole('dialog');
          if (dialog && dialog.getAttribute('data-state') !== 'closed') {
            throw new Error('drawer still open');
          }
        },
        { timeout: 1200 }
      );
    });
  },
};

export const NaoDismissible: Story = {
  args: {
    defaultOpen: true,
    dismissible: false,
    triggerLabel: 'Confirmar termos',
    title: 'Aceitar termos',
    description: 'É necessário confirmar antes de continuar.',
    actionLabel: 'Aceitar',
    cancelLabel: 'Recusar',
  },
  parameters: {
    docs: { description: { story: 'dismissible=false — ESC, swipe e clique no overlay não fecham. Apenas o botão de ação dispensa.' } },
  },
  play: async () => {
    const dialog = await waitForPortal('dialog');
    await expect(dialog).toBeVisible();
  },
};
