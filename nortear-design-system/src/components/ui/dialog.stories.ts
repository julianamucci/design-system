import type { Meta, StoryObj } from '@storybook/html';
import { userEvent, within, expect, fn, waitFor } from 'storybook/test';
import { createDialog } from './dialog';
import { createButton } from './button';
import { createDialogDocs } from '@/components/docs/DialogDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────

type DialogArgs = {
  triggerLabel: string;
  title: string;
  description: string;
  cancelLabel: string;
  actionLabel: string;
  showCloseButton: boolean;
};

const meta: Meta<DialogArgs> = {
  title: 'UI/Dialog',
  tags: ['autodocs', 'overlay'],
  parameters: {
    docs: { page: withAutoDocsTab(createDialogDocs) },
  },
  argTypes: {
    triggerLabel: { control: 'text', description: 'Texto do botão que abre o diálogo.' },
    title:        { control: 'text', description: 'Título exibido no header (aria-labelledby).' },
    description:  { control: 'text', description: 'Descrição (aria-describedby).' },
    cancelLabel:  { control: 'text', description: 'Texto do botão de cancelar.' },
    actionLabel:  { control: 'text', description: 'Texto do botão de ação primária.' },
    showCloseButton: {
      control: 'boolean',
      description: 'Exibe o botão X no canto superior direito.',
    },
  },
  args: {
    triggerLabel: 'Editar perfil',
    title: 'Editar perfil',
    description: 'Atualize suas informações pessoais. As mudanças são salvas ao confirmar.',
    cancelLabel: 'Cancelar',
    actionLabel: 'Salvar alterações',
    showCloseButton: true,
  },
};

export default meta;
type Story = StoryObj<DialogArgs>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildPlayground(args: DialogArgs, onAction?: () => void): HTMLElement {
  const trigger = createButton({ variant: 'outline', label: args.triggerLabel });
  const cancel = createButton({ variant: 'outline', label: args.cancelLabel });
  const action = createButton({ variant: 'default', label: args.actionLabel });

  const content = document.createElement('div');
  content.className = 'nds-text-body nds-text-muted-foreground';
  content.textContent = 'Conteúdo do corpo do diálogo (formulário, mensagem, mídia).';

  const footer = document.createElement('div');
  footer.className = 'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2';
  footer.appendChild(cancel);
  footer.appendChild(action);

  const dialog = createDialog({
    trigger,
    title: args.title,
    description: args.description,
    content,
    footer,
    showCloseButton: args.showCloseButton,
  });

  cancel.addEventListener('click', () => {
    const overlay = document.querySelector<HTMLElement>('[data-slot="dialog-overlay"]');
    overlay?.click();
  });
  action.addEventListener('click', () => {
    onAction?.();
    const overlay = document.querySelector<HTMLElement>('[data-slot="dialog-overlay"]');
    overlay?.click();
  });

  return dialog;
}

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  render: (args) => buildPlayground(args, fn()),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);

    const triggerRe = new RegExp(args.triggerLabel, 'i');
    const waitForClose = async () => {
      await waitFor(() => {
        if (body.queryByRole('dialog')) throw new Error('dialog still open');
      }, { timeout: 800 });
    };

    await step('1. Abre ao clicar no trigger', async () => {
      const trigger = canvas.getByRole('button', { name: triggerRe });
      await expect(trigger).toBeInTheDocument();
      await userEvent.click(trigger);
      const dialog = await body.findByRole('dialog');
      await expect(dialog).toHaveAttribute('aria-modal', 'true');
      await expect(dialog).toHaveAccessibleName(new RegExp(args.title, 'i'));
    });

    await step('5. Focus trap — foco move para dentro do dialog', async () => {
      const dialog = await body.findByRole('dialog');
      await waitFor(() => {
        if (!dialog.contains(document.activeElement)) throw new Error('focus not trapped');
      });
    });

    await step('2. Escape fecha o diálogo', async () => {
      await userEvent.keyboard('{Escape}');
      await waitForClose();
    });

    await step('6. Retorno de foco ao trigger após Escape', async () => {
      await waitFor(() => {
        const trigger = canvas.getByRole('button', { name: triggerRe });
        if (document.activeElement !== trigger) throw new Error('focus did not return');
      });
    });

    await step('3. Reabrir e fechar via clique no overlay', async () => {
      const trigger = canvas.getByRole('button', { name: triggerRe });
      await userEvent.click(trigger);
      await body.findByRole('dialog');
      const overlay = document.querySelector<HTMLElement>('[data-slot="dialog-overlay"]');
      await expect(overlay).not.toBeNull();
      overlay?.click();
      await waitForClose();
    });

    await step('4. Reabrir e fechar via botão Close (X)', async () => {
      const trigger = canvas.getByRole('button', { name: triggerRe });
      await userEvent.click(trigger);
      const dialog = await body.findByRole('dialog');
      const closeBtn = within(dialog).getByRole('button', { name: /close/i });
      await userEvent.click(closeBtn);
      await waitForClose();
    });

    await step('7. Uncontrolled — factory mantém estado interno (sem prop open)', async () => {
      const trigger = canvas.getByRole('button', { name: triggerRe });
      await userEvent.click(trigger);
      await body.findByRole('dialog');
      // Fecha via Escape para validar que o estado interno responde sem controle externo
      await userEvent.keyboard('{Escape}');
      await waitForClose();
    });
  },
};
