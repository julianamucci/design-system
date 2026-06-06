import type { Meta, StoryObj } from '@storybook/html';
import { userEvent, within, expect, fn } from 'storybook/test';
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
  tone: 'destructive' | 'default';
};

const meta: Meta<AlertDialogArgs> = {
  title: 'UI/AlertDialog',
  tags: ['autodocs', 'overlay'],
  parameters: {
    docs: { page: withAutoDocsTab(createAlertDialogDocs) },
  },
  argTypes: {
    tone: {
      control: 'select',
      options: ['destructive', 'default'],
      description: 'Severidade do action (aplica tokens destructive ou padrão).',
    },
  },
  args: {
    triggerLabel: 'Excluir conta',
    title: 'Excluir sua conta?',
    description:
      'Essa ação é permanente. Todos os dados, arquivos e histórico serão removidos e não poderão ser recuperados.',
    cancelLabel: 'Cancelar',
    actionLabel: 'Excluir conta',
    tone: 'destructive',
  },
};

export default meta;
type Story = StoryObj<AlertDialogArgs>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildDemo(args: AlertDialogArgs, onConfirm?: () => void, onCancel?: () => void): HTMLElement {
  const trigger = createButton({
    variant: args.tone === 'destructive' ? 'destructive' : 'default',
    label: args.triggerLabel,
  });
  const cancelButton = createButton({
    variant: 'outline',
    label: args.cancelLabel,
    onClick: onCancel,
  });
  const actionButton = createButton({
    variant: 'default',
    label: args.actionLabel,
    onClick: onConfirm,
    class:
      args.tone === 'destructive'
        ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
        : '',
  });
  return createAlertDialog({
    trigger,
    title: args.title,
    description: args.description,
    cancelButton,
    actionButton,
  });
}

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  render: (args) => buildDemo(args, fn(), fn()),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);

    await step('Trigger está presente no DOM', async () => {
      const trigger = canvas.getByRole('button', { name: /Excluir conta/i });
      await expect(trigger).toBeInTheDocument();
    });

    await step('Diálogo abre ao clicar no trigger', async () => {
      const trigger = canvas.getByRole('button', { name: /Excluir conta/i });
      await userEvent.click(trigger);
      const dialog = await body.findByRole('alertdialog');
      await expect(dialog).toBeVisible();
    });

    await step('Diálogo tem role alertdialog e aria-modal', async () => {
      const dialog = await body.findByRole('alertdialog');
      await expect(dialog).toHaveAttribute('role', 'alertdialog');
      await expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    await step('Título e descrição são acessíveis', async () => {
      const dialog = await body.findByRole('alertdialog');
      await expect(dialog).toHaveAccessibleName(/Excluir sua conta/i);
    });

    await step('Clique em Cancelar fecha o diálogo', async () => {
      const cancel = await body.findByRole('button', { name: /Cancelar/i });
      await userEvent.click(cancel);
      await expect(body.queryByRole('alertdialog')).not.toBeInTheDocument();
    });
  },
};
