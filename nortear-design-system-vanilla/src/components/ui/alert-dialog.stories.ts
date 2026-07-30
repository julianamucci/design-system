import type { Meta, StoryObj } from '@storybook/html-vite';
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
  /** Documentada na aba API Reference; o Playground não a encaminha. */
  onOpenChange?: (open: boolean) => void;
};

const meta: Meta<AlertDialogArgs> = {
  title: 'UI/AlertDialog',
  tags: ['autodocs', 'overlay'],
  parameters: {
    docs: { page: withAutoDocsTab(createAlertDialogDocs) },
  },
  // Esta stack não tem docgen (não há componente de framework para
  // introspectar): a aba "API Reference" sai só destes argTypes.
  argTypes: {
    tone: {
      control: 'select',
      options: ['destructive', 'default'],
      description: 'Severidade do action — escolhe a variante do Button de confirmação.',
      table: { type: { summary: "'destructive' | 'default'" }, defaultValue: { summary: "'destructive'" } },
    },
    triggerLabel: {
      control: 'text',
      description: 'Rótulo do botão que abre o diálogo.',
      table: { type: { summary: 'string' } },
    },
    title: {
      control: 'text',
      description: 'Título do diálogo, associado por aria-labelledby.',
      table: { type: { summary: 'string' } },
    },
    description: {
      control: 'text',
      description: 'Descrição do diálogo, associada por aria-describedby.',
      table: { type: { summary: 'string' } },
    },
    cancelLabel: {
      control: 'text',
      description: 'Rótulo do botão que fecha sem executar a ação.',
      table: { type: { summary: 'string' } },
    },
    actionLabel: {
      control: 'text',
      description: 'Rótulo do botão que confirma a ação.',
      table: { type: { summary: 'string' } },
    },
    onOpenChange: {
      control: false,
      description: 'Callback disparado quando o diálogo abre ou fecha.',
      table: { type: { summary: '(open: boolean) => void' } },
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
  // Variante do Button, não classe de fundo crua: bg-destructive e
  // text-destructive-foreground saíram com o Tailwind e não têm CSS.
  const actionButton = createButton({
    variant: args.tone === 'destructive' ? 'destructive' : 'default',
    label: args.actionLabel,
    onClick: onConfirm,
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
  // O renderer html monta o snippet a partir do outerHTML, que é um dump de DOM
  // e não o que o consumidor escreve. Aqui vai a composição real das factories,
  // montada a partir dos args para acompanhar os controls.
  parameters: {
    docs: {
      source: {
        transform: (_generated: string, ctx: { args?: Partial<AlertDialogArgs> }) => {
          const a = ctx.args ?? {};
          const actionVariant = a.tone === 'destructive' ? 'destructive' : 'default';
          return [
            "import { createAlertDialog } from '@/components/ui/alert-dialog';",
            "import { createButton } from '@/components/ui/button';",
            '',
            `const trigger = createButton({ variant: '${actionVariant}', label: '${a.triggerLabel ?? ''}' });`,
            `const cancelButton = createButton({ variant: 'outline', label: '${a.cancelLabel ?? ''}' });`,
            `const actionButton = createButton({ variant: '${actionVariant}', label: '${a.actionLabel ?? ''}' });`,
            '',
            'const dialog = createAlertDialog({',
            '  trigger,',
            `  title: '${a.title ?? ''}',`,
            `  description: '${a.description ?? ''}',`,
            '  cancelButton,',
            '  actionButton,',
            '});',
            '',
            "document.querySelector('#app')?.append(dialog);",
          ].join('\n');
        },
      },
    },
  },
  render: (args) => buildDemo(args, fn(), fn()),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);

    await step('Trigger está presente e anuncia que abre um diálogo', async () => {
      const trigger = canvas.getByRole('button', { name: /Excluir conta/i });
      await expect(trigger).toBeInTheDocument();
      await expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
    });

    await step('A raiz identifica a instância do diálogo', async () => {
      const root = canvasElement.querySelector('[data-slot="alert-dialog"]');
      await expect(root).toHaveAttribute('data-dialog-id');
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
