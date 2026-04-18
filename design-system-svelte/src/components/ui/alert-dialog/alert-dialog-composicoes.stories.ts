import type { Meta, StoryObj } from '@storybook/svelte';
import { userEvent, within, expect } from 'storybook/test';
import { AlertDialog } from './index';
import AlertDialogStory from './AlertDialogStory.svelte';

const meta = {
  title: 'UI/AlertDialog/Composições',
  component: AlertDialog,
} satisfies Meta<typeof AlertDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TriggerPersonalizado: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Use asChild no AlertDialogTrigger para qualquer elemento como gatilho — link, ícone, item de menu.',
      },
    },
  },
  render: () => ({
    Component: AlertDialogStory,
    props: {
      triggerLabel: 'Excluir conta',
      triggerVariant: 'destructive',
      title: 'Excluir conta',
      description: 'Todos os seus dados serão removidos permanentemente. Esta ação não pode ser desfeita.',
      cancelLabel: 'Cancelar',
      actionLabel: 'Excluir',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: 'Excluir conta' });

    await step('Trigger está acessível', async () => {
      await expect(trigger).toBeInTheDocument();
      await expect(trigger).toBeEnabled();
    });

    await step('Clicar no trigger abre o modal', async () => {
      await userEvent.click(trigger);
      const dialog = await within(document.body).findByRole('alertdialog');
      await expect(dialog).toBeVisible();
    });

    await step('Fechar modal via Cancelar', async () => {
      const cancelBtn = within(document.body).getByRole('button', { name: 'Cancelar' });
      await userEvent.click(cancelBtn);
      await expect(within(document.body).queryByRole('alertdialog')).not.toBeInTheDocument();
    });
  },
};

export const ComIcone: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Trigger com ícone — útil em tabelas ou listas de ações. O aria-label garante acessibilidade.',
      },
    },
  },
  render: () => ({
    Component: AlertDialogStory,
    props: {
      triggerLabel: 'Excluir item',
      triggerVariant: 'ghost',
      title: 'Excluir item selecionado',
      description: 'O item será removido permanentemente da sua lista. Esta ação não pode ser desfeita.',
      cancelLabel: 'Cancelar',
      actionLabel: 'Excluir',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: 'Excluir item' });

    await step('Trigger está acessível', async () => {
      await expect(trigger).toBeInTheDocument();
    });

    await step('Clicar no trigger abre o modal', async () => {
      await userEvent.click(trigger);
      const dialog = await within(document.body).findByRole('alertdialog');
      await expect(dialog).toBeVisible();
    });

    await step('Fechar modal via Cancelar', async () => {
      const cancelBtn = within(document.body).getByRole('button', { name: 'Cancelar' });
      await userEvent.click(cancelBtn);
      await expect(within(document.body).queryByRole('alertdialog')).not.toBeInTheDocument();
    });
  },
};
