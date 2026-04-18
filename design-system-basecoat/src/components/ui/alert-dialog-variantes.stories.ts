import type { Meta, StoryObj } from '@storybook/html';
import { userEvent, within, expect } from 'storybook/test';
import { createAlertDialog } from './alert-dialog';
import { createButton } from './button';

const meta: Meta = {
  title: 'UI/AlertDialog/Variantes',
};

export default meta;
type Story = StoryObj;

export const Destrutiva: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Use para ações que removem dados permanentemente. O botão de confirmação deve ter variante destructive.',
      },
    },
  },
  render: () => {
    const trigger = createButton({ label: 'Excluir item', variant: 'destructive' });
    const cancel  = createButton({ label: 'Cancelar' });
    const action  = createButton({ label: 'Excluir', variant: 'destructive' });
    const wrapper = createAlertDialog({
      trigger,
      title: 'Excluir item selecionado',
      description: 'O item será removido permanentemente da sua lista. Esta ação não pode ser desfeita.',
      cancelButton: cancel,
      actionButton: action,
    });
    // Open for Chromatic visual capture
    setTimeout(() => trigger.click(), 0);
    return wrapper;
  },
  play: async ({ step }) => {
    await step('Modal está visível no estado aberto', async () => {
      const dialog = await within(document.body).findByRole('alertdialog');
      await expect(dialog).toBeVisible();
    });
  },
};

export const Neutra: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Use para confirmações de ações sem caráter destrutivo — envio de formulário, publicação, confirmação de pedido.',
      },
    },
  },
  render: () => {
    const trigger = createButton({ label: 'Confirmar envio' });
    const cancel  = createButton({ label: 'Cancelar' });
    const action  = createButton({ label: 'Enviar' });
    const wrapper = createAlertDialog({
      trigger,
      title: 'Confirmar envio do relatório',
      description: 'O relatório será enviado para todos os destinatários da lista.',
      cancelButton: cancel,
      actionButton: action,
    });
    // Open for Chromatic visual capture
    setTimeout(() => trigger.click(), 0);
    return wrapper;
  },
  play: async ({ step }) => {
    await step('Modal está visível no estado aberto', async () => {
      const dialog = await within(document.body).findByRole('alertdialog');
      await expect(dialog).toBeVisible();
    });
  },
};
