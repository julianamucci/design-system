import type { Meta, StoryObj } from '@storybook/html';
import { within, expect } from 'storybook/test';
import { createAlertDialog } from './alert-dialog';
import { createButton } from './button';

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta = {
  tags: ['overlay'],
  title: 'UI/AlertDialog/Composicoes',
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      description: {
        component: 'Composicoes canônicas: confirmação destrutiva e neutra.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers ──────────────────────────────────────────────────────────────────

type Options = {
  triggerLabel: string;
  triggerVariant: 'destructive' | 'default' | 'outline';
  title: string;
  description: string;
  cancelLabel: string;
  actionLabel: string;
  tone: 'destructive' | 'default';
};

function buildDemo(opts: Options): HTMLElement {
  const trigger = createButton({ variant: opts.triggerVariant, label: opts.triggerLabel });
  const cancelButton = createButton({ variant: 'outline', label: opts.cancelLabel });
  const actionButton = createButton({
    variant: 'default',
    label: opts.actionLabel,
    class:
      opts.tone === 'destructive'
        ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
        : '',
  });
  const dialog = createAlertDialog({
    trigger,
    title: opts.title,
    description: opts.description,
    cancelButton,
    actionButton,
  });
  queueMicrotask(() => trigger.click());
  return dialog;
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Destrutiva: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Action com tokens bg-destructive + text-destructive-foreground e trigger variant=destructive. Use para ações irreversíveis.',
      },
    },
  },
  render: () =>
    buildDemo({
      triggerLabel: 'Excluir conta',
      triggerVariant: 'destructive',
      title: 'Excluir sua conta?',
      description:
        'Essa ação é permanente. Todos os dados, arquivos e histórico serão removidos.',
      cancelLabel: 'Cancelar',
      actionLabel: 'Excluir conta',
      tone: 'destructive',
    }),
  play: async () => {
    const body = within(document.body);
    const dialog = await body.findByRole('alertdialog');
    await expect(dialog).toBeVisible();
    // Trigger e action têm o mesmo rótulo — o action fica dentro do dialog.
    const action = within(dialog).getByRole('button', { name: /Excluir conta/i });
    await expect(action).toHaveClass('bg-destructive');
  },
};

export const Neutra: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Action com tokens padrão do Button. Use para confirmações não destrutivas (publicar, enviar, arquivar).',
      },
    },
  },
  render: () =>
    buildDemo({
      triggerLabel: 'Publicar agora',
      triggerVariant: 'default',
      title: 'Publicar este conteúdo?',
      description:
        'Ao publicar, o conteúdo fica visível para todos os usuários. Você poderá editá-lo depois.',
      cancelLabel: 'Voltar',
      actionLabel: 'Publicar',
      tone: 'default',
    }),
  play: async () => {
    const body = within(document.body);
    const dialog = await body.findByRole('alertdialog');
    await expect(dialog).toBeVisible();
    const action = await body.findByRole('button', { name: /^Publicar$/i });
    await expect(action).toBeVisible();
  },
};
