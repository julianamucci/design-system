import type { Meta, StoryObj } from '@storybook/html';
import { fn, userEvent, within, expect } from 'storybook/test';
import { createAlertDialog } from './alert-dialog';
import { createButton } from './button';
import { createAlertDialogDocs } from '@/components/docs/AlertDialogDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────

type AlertDialogArgs = {
  triggerLabel: string;
  title: string;
  description: string;
  cancelLabel: string;
  actionLabel: string;
};

const meta: Meta<AlertDialogArgs> = {
  title: 'UI/AlertDialog',
  tags: ['autodocs'],
  parameters: {
    docs: { page: withAutoDocsTab(createAlertDialogDocs) },
  },
  argTypes: {
    triggerLabel:  { control: 'text', description: 'Texto do trigger'         },
    title:         { control: 'text', description: 'Título do diálogo'        },
    description:   { control: 'text', description: 'Descrição do diálogo'     },
    cancelLabel:   { control: 'text', description: 'Texto do botão cancelar'  },
    actionLabel:   { control: 'text', description: 'Texto do botão de ação'   },
  },
  args: {
    triggerLabel:  'Excluir conta',
    title:         'Excluir conta',
    description:   'Todos os seus dados serão removidos permanentemente. Esta ação não pode ser desfeita.',
    cancelLabel:   'Cancelar',
    actionLabel:   'Excluir',
  },
};

export default meta;
type Story = StoryObj<AlertDialogArgs>;

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  render: (args) => {
    const trigger = createButton({ label: args.triggerLabel, variant: 'destructive' });
    const cancel  = createButton({ label: args.cancelLabel });
    const action  = createButton({ label: args.actionLabel });
    return createAlertDialog({
      trigger,
      title: args.title,
      description: args.description,
      cancelButton: cancel,
      actionButton: action,
    });
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: 'Excluir conta' });

    await step('Trigger está acessível e habilitado', async () => {
      await expect(trigger).toBeInTheDocument();
      await expect(trigger).toBeEnabled();
    });

    await step('Trigger recebe foco via teclado', async () => {
      trigger.focus();
      await expect(trigger).toHaveFocus();
    });

    await step('Clicar no trigger abre o modal', async () => {
      await userEvent.click(trigger);
      const dialog = await within(document.body).findByRole('alertdialog');
      await expect(dialog).toBeVisible();
    });

    await step('Modal tem role alertdialog e título correto', async () => {
      const dialog = within(document.body).getByRole('alertdialog');
      await expect(dialog).toHaveAttribute('role', 'alertdialog');
      await expect(within(document.body).getByText('Excluir conta')).toBeVisible();
    });

    await step('Cancelar fecha o modal', async () => {
      const cancelBtn = within(document.body).getByRole('button', { name: 'Cancelar' });
      await userEvent.click(cancelBtn);
      await expect(within(document.body).queryByRole('alertdialog')).not.toBeInTheDocument();
    });
  },
};
