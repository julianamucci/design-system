import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect, fn, waitFor } from 'storybook/test';
import { createAlertDialog } from './alert-dialog';
import { createButton } from './button';

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta = {
  tags: ['overlay'],
  title: 'UI/AlertDialog/Estados',
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      description: {
        component:
          'Cada estado canônico do AlertDialog: closed, open, confirmed, cancelled.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers ──────────────────────────────────────────────────────────────────

type DemoOptions = {
  triggerLabel: string;
  title: string;
  description: string;
  cancelLabel: string;
  actionLabel: string;
  tone: 'destructive' | 'default';
  onConfirm?: () => void;
  onCancel?: () => void;
  openInitially?: boolean;
};

function buildDemo(opts: DemoOptions): HTMLElement {
  const trigger = createButton({
    variant: opts.tone === 'destructive' ? 'destructive' : 'default',
    label: opts.triggerLabel,
  });
  const cancelButton = createButton({
    variant: 'outline',
    label: opts.cancelLabel,
    onClick: opts.onCancel,
  });
  // Variante do Button, não classe de fundo crua: bg-destructive e
  // text-destructive-foreground saíram com o Tailwind e não têm CSS.
  const actionButton = createButton({
    variant: opts.tone === 'destructive' ? 'destructive' : 'default',
    label: opts.actionLabel,
    onClick: opts.onConfirm,
  });
  const dialog = createAlertDialog({
    trigger,
    title: opts.title,
    description: opts.description,
    cancelButton,
    actionButton,
  });

  if (opts.openInitially) {
    // Vanilla AlertDialog opens on trigger click. Open programmatically for snapshots.
    queueMicrotask(() => trigger.click());
  }

  return dialog;
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Closed: Story = {
  parameters: {
    docs: {
      description: { story: 'Estado inicial — apenas o trigger é visível.' },
    },
  },
  render: () =>
    buildDemo({
      triggerLabel: 'Excluir item',
      title: 'Confirmar exclusão',
      description: 'Esta ação não pode ser desfeita.',
      cancelLabel: 'Cancelar',
      actionLabel: 'Excluir',
      tone: 'destructive',
    }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    const trigger = canvas.getByRole('button', { name: /Excluir item/i });
    await expect(trigger).toBeVisible();
    await expect(body.queryByRole('alertdialog')).not.toBeInTheDocument();
  },
};

export const Open: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Diálogo aberto programaticamente. Captura visual no Chromatic.',
      },
    },
  },
  render: () =>
    buildDemo({
      triggerLabel: 'Excluir item',
      title: 'Excluir item permanentemente?',
      description: 'O item será removido de forma definitiva e não poderá ser recuperado.',
      cancelLabel: 'Cancelar',
      actionLabel: 'Excluir',
      tone: 'destructive',
      openInitially: true,
    }),
  play: async () => {
    const body = within(document.body);
    const dialog = await body.findByRole('alertdialog');
    await expect(dialog).toBeVisible();
  },
};

export const Confirmed: Story = {
  parameters: {
    docs: {
      description: { story: 'Clique em Action dispara o handler e fecha o diálogo.' },
    },
  },
  render: () =>
    buildDemo({
      triggerLabel: 'Excluir',
      title: 'Confirmar exclusão',
      description: 'Esta ação é permanente.',
      cancelLabel: 'Cancelar',
      actionLabel: 'Excluir',
      tone: 'destructive',
      onConfirm: fn(),
      openInitially: true,
    }),
  play: async ({ step }) => {
    const body = within(document.body);
    await step('Clique em Excluir fecha o diálogo', async () => {
      // Trigger e action têm rótulo "Excluir" — desambigua via scope do dialog.
      const dialog = await body.findByRole('alertdialog');
      const action = within(dialog).getByRole('button', { name: /^Excluir$/i });
      await userEvent.click(action);
      await expect(body.queryByRole('alertdialog')).not.toBeInTheDocument();
    });
  },
};

export const Cancelled: Story = {
  parameters: {
    docs: {
      description: { story: 'Cancel é clicado — diálogo fecha sem executar ação.' },
    },
  },
  render: () =>
    buildDemo({
      triggerLabel: 'Excluir',
      title: 'Confirmar exclusão',
      description: 'Esta ação é permanente.',
      cancelLabel: 'Cancelar',
      actionLabel: 'Excluir',
      tone: 'destructive',
      onCancel: fn(),
      openInitially: true,
    }),
  play: async ({ step }) => {
    const body = within(document.body);
    await step('Clique em Cancelar fecha o diálogo', async () => {
      const cancel = await body.findByRole('button', { name: /Cancelar/i });
      await userEvent.click(cancel);
      await expect(body.queryByRole('alertdialog')).not.toBeInTheDocument();
    });
  },
};

// ─── Controlled ───────────────────────────────────────────────────────────────

export const Controlled: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Abertura comandada por estado externo — o trigger fica fora do diálogo e o callback de mudança reporta cada transição.',
      },
    },
  },
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.className = 'nds-stack';
    wrapper.dataset.spacing = 'sm';

    const externalTrigger = createButton({
      variant: 'destructive',
      label: 'Abrir via estado externo',
    });

    // Trigger vazio: quem comanda a abertura é o botão externo acima.
    const dialog = createAlertDialog({
      trigger: externalTrigger,
      title: 'Controlado pelo pai',
      description: 'Este diálogo é comandado por estado externo.',
      cancelButton: createButton({ variant: 'outline', label: 'Fechar' }),
      actionButton: createButton({ variant: 'destructive', label: 'Confirmar' }),
      onOpenChange: fn(),
    });

    wrapper.append(dialog);
    return wrapper;
  },

  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);

    await step('Clique no trigger externo abre o diálogo', async () => {
      const trigger = canvas.getByRole('button', { name: /Abrir via estado externo/i });
      await userEvent.click(trigger);
      const dialog = await body.findByRole('alertdialog');
      await expect(dialog).toBeVisible();
    });

    await step('Escape fecha o diálogo controlado', async () => {
      await userEvent.keyboard('{Escape}');
      await waitFor(() =>
        expect(body.queryByRole('alertdialog')).not.toBeInTheDocument(),
      );
    });
  },
};
