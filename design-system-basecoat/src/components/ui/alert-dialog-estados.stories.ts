import type { Meta, StoryObj } from '@storybook/html';
import { userEvent, within, expect } from 'storybook/test';
import { createAlertDialog } from './alert-dialog';
import { createButton } from './button';

const meta: Meta = {
  title: 'UI/AlertDialog/Estados',
};

export default meta;
type Story = StoryObj;

export const Aberto: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Estado aberto do AlertDialog para captura visual. Overlay escuro, modal centralizado, botões de ação visíveis.',
      },
    },
  },
  render: () => {
    const trigger = createButton({ label: 'Excluir conta', variant: 'destructive' });
    const cancel  = createButton({ label: 'Cancelar' });
    const action  = createButton({ label: 'Excluir' });
    const wrapper = createAlertDialog({
      trigger,
      title: 'Excluir conta',
      description: 'Todos os seus dados serão removidos permanentemente. Esta ação não pode ser desfeita.',
      cancelButton: cancel,
      actionButton: action,
    });
    setTimeout(() => trigger.click(), 0);
    return wrapper;
  },
  play: async ({ step }) => {
    await step('Modal está aberto com role alertdialog', async () => {
      const dialog = await within(document.body).findByRole('alertdialog');
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

    await step('Cancelar fecha o modal', async () => {
      const cancelBtn = within(document.body).getByRole('button', { name: 'Cancelar' });
      await userEvent.click(cancelBtn);
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
  render: () => {
    const trigger = createButton({ label: 'Excluir conta', variant: 'destructive', disabled: true });
    const cancel  = createButton({ label: 'Cancelar' });
    const action  = createButton({ label: 'Excluir' });
    return createAlertDialog({
      trigger,
      title: 'Excluir conta',
      description: 'Todos os seus dados serão removidos permanentemente.',
      cancelButton: cancel,
      actionButton: action,
    });
  },
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
