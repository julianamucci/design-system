import type { Meta, StoryObj } from '@storybook/svelte';
import { userEvent, within, expect } from 'storybook/test';
import { AlertDialog } from './index';
import AlertDialogStory from './AlertDialogStory.svelte';

const meta = {
  title: 'UI/AlertDialog/Estados',
  component: AlertDialog,
} satisfies Meta<typeof AlertDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Aberto: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Estado aberto do AlertDialog para captura visual. Overlay escuro, modal centralizado, botões de ação visíveis.',
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
      defaultOpen: true,
    },
  }),
  play: async ({ step }) => {
    await step('Modal está aberto com role alertdialog', async () => {
      const dialog = within(document.body).getByRole('alertdialog');
      await expect(dialog).toBeVisible();
      await expect(dialog).toHaveAttribute('role', 'alertdialog');
    });

    await step('Título e descrição estão presentes', async () => {
      await expect(within(document.body).getByText('Excluir conta')).toBeVisible();
      await expect(within(document.body).getByText(/removidos permanentemente/i)).toBeVisible();
    });

    await step('Botões Cancelar e Excluir estão visíveis', async () => {
      await expect(within(document.body).getByRole('button', { name: 'Cancelar' })).toBeVisible();
      await expect(within(document.body).getByRole('button', { name: 'Excluir' })).toBeVisible();
    });

    await step('Escape fecha o modal', async () => {
      await userEvent.keyboard('{Escape}');
      await expect(within(document.body).queryByRole('alertdialog')).not.toBeInTheDocument();
    });
  },
};

export const TriggerDesabilitado: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Trigger desabilitado — o modal não abre quando o botão está no estado disabled.',
      },
    },
  },
  render: () => ({
    Component: AlertDialogStory,
    props: {
      triggerLabel: 'Excluir conta',
      triggerVariant: 'destructive',
      title: 'Excluir conta',
      description: 'Todos os seus dados serão removidos permanentemente.',
      cancelLabel: 'Cancelar',
      actionLabel: 'Excluir',
      disabled: true,
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: 'Excluir conta' });

    await step('Trigger está desabilitado', async () => {
      await expect(trigger).toBeDisabled();
    });

    await step('Clicar no trigger desabilitado não abre o modal', async () => {
      await userEvent.click(trigger, { pointerEventsCheck: 0 });
      await expect(within(document.body).queryByRole('alertdialog')).not.toBeInTheDocument();
    });
  },
};
