import type { Meta, StoryObj } from '@storybook/html';
import { userEvent, within, expect } from 'storybook/test';
import { createAlertDialog } from './alert-dialog';
import { createButton } from './button';

const meta: Meta = {
  title: 'UI/AlertDialog/Composições',
};

export default meta;
type Story = StoryObj;

export const TriggerPersonalizado: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Qualquer elemento pode ser o trigger — link, span ou ícone. Adicione role="button" e tabindex="0" para acessibilidade.',
      },
    },
  },
  render: () => {
    const trigger = document.createElement('span');
    trigger.role = 'button';
    trigger.tabIndex = 0;
    trigger.className = 'text-sm text-destructive underline cursor-pointer hover:text-destructive/80';
    trigger.textContent = 'Excluir conta';
    trigger.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') trigger.click();
    });
    const cancel = createButton({ label: 'Cancelar' });
    const action = createButton({ label: 'Excluir' });
    return createAlertDialog({
      trigger,
      title: 'Excluir conta',
      description: 'Todos os seus dados serão removidos permanentemente. Esta ação não pode ser desfeita.',
      cancelButton: cancel,
      actionButton: action,
    });
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: 'Excluir conta' });

    await step('Trigger personalizado está acessível', async () => {
      await expect(trigger).toBeInTheDocument();
    });

    await step('Clicar no trigger personalizado abre o modal', async () => {
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
        story: 'Trigger com ícone de lixeira — útil em tabelas ou listas de ações. O aria-label garante acessibilidade.',
      },
    },
  },
  render: () => {
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'btn-ghost btn-icon';
    trigger.setAttribute('aria-label', 'Excluir item');
    trigger.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-destructive" aria-hidden="true"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>`;
    const cancel = createButton({ label: 'Cancelar' });
    const action = createButton({ label: 'Excluir' });
    return createAlertDialog({
      trigger,
      title: 'Excluir item selecionado',
      description: 'O item será removido permanentemente da sua lista. Esta ação não pode ser desfeita.',
      cancelButton: cancel,
      actionButton: action,
    });
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: 'Excluir item' });

    await step('Trigger ícone tem aria-label acessível', async () => {
      await expect(trigger).toBeInTheDocument();
      await expect(trigger).toHaveAttribute('aria-label', 'Excluir item');
    });

    await step('Clicar no ícone abre o modal', async () => {
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
