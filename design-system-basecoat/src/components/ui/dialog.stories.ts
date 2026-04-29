import type { Meta, StoryObj } from '@storybook/html';
import { userEvent, within, expect, fn } from 'storybook/test';
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
  tags: ['autodocs'],
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
  content.className = 'text-sm text-muted-foreground';
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

    await step('Trigger renderiza', async () => {
      const trigger = canvas.getByRole('button', { name: new RegExp(args.triggerLabel, 'i') });
      await expect(trigger).toBeInTheDocument();
    });

    await step('Abre ao clicar e expõe role=dialog + aria-modal', async () => {
      const trigger = canvas.getByRole('button', { name: new RegExp(args.triggerLabel, 'i') });
      await userEvent.click(trigger);
      const dialog = await body.findByRole('dialog');
      await expect(dialog).toHaveAttribute('aria-modal', 'true');
      await expect(dialog).toHaveAccessibleName(new RegExp(args.title, 'i'));
    });

    await step('Escape fecha o diálogo', async () => {
      await userEvent.keyboard('{Escape}');
      await expect(body.queryByRole('dialog')).not.toBeInTheDocument();
    });
  },
};
