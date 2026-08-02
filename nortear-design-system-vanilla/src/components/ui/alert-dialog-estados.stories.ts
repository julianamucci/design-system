import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect, fn, waitFor } from 'storybook/test';
import { waitForPortal } from '@/lib/wait-for-portal';
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

// ─── Spies ────────────────────────────────────────────────────────────────────
//
// No escopo do módulo (e não dentro do `render`) para que as play functions
// consigam verificar que o handler realmente disparou — dentro do render eles
// ficam presos ao closure e o teste só consegue observar o DOM.

const onConfirmSpy = fn();
const onCancelSpy = fn();
const onOpenChangeSpy = fn();

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
  play: async ({ step }) => {

    await step('Conteúdo aberto traz título e descrição', async () => {
      const dialog = await waitForPortal('alertdialog');
      // A entrada é animada (opacity 0 → 1): no primeiro quadro o painel já
      // está no DOM mas ainda conta como invisível. waitFor passa no primeiro
      // tick quando não há animação, então serve aos dois ambientes.
      await waitFor(() => expect(dialog).toBeVisible());
      await expect(dialog).toHaveTextContent('Excluir item permanentemente?');
      await expect(dialog).toHaveTextContent(
        'O item será removido de forma definitiva e não poderá ser recuperado.',
      );
    });

    await step('Foco inicial no Cancelar', async () => {
      const dialog = await waitForPortal('alertdialog');
      await waitFor(() =>
        expect(within(dialog).getByRole('button', { name: /Cancelar/i })).toHaveFocus(),
      );
    });
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
      onConfirm: onConfirmSpy,
      openInitially: true,
    }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    onConfirmSpy.mockClear();

    await step('Clique em Excluir dispara a ação e fecha o diálogo', async () => {
      // Trigger e action têm rótulo "Excluir" — desambigua via scope do dialog.
      const dialog = await waitForPortal('alertdialog');
      const action = within(dialog).getByRole('button', { name: /^Excluir$/i });
      await userEvent.click(action);
      await expect(onConfirmSpy).toHaveBeenCalledTimes(1);
      // A saída também é animada: o painel só sai do DOM depois do animationend
      // (ou do fallback de tempo), não no clique.
      await waitFor(() => expect(body.queryByRole('alertdialog')).not.toBeInTheDocument());
    });

    await step('Enter no Action confirma pelo teclado e devolve o foco ao trigger', async () => {
      // Reabre pelo trigger (e não por click() programático) para que o foco
      // anterior exista e o retorno de foco possa ser verificado.
      const trigger = canvas.getByRole('button', { name: /^Excluir$/i });
      await userEvent.click(trigger);

      const dialog = await waitForPortal('alertdialog');
      const action = within(dialog).getByRole('button', { name: /^Excluir$/i });
      // Foco entra em Cancelar; Tab leva ao Action.
      await userEvent.tab();
      await expect(action).toHaveFocus();

      await userEvent.keyboard('{Enter}');
      await expect(onConfirmSpy).toHaveBeenCalledTimes(2);
      await waitFor(() => expect(body.queryByRole('alertdialog')).not.toBeInTheDocument());
      await expect(trigger).toHaveFocus();
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
      onCancel: onCancelSpy,
      openInitially: true,
    }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    onCancelSpy.mockClear();
    onConfirmSpy.mockClear();

    await step('Clique em Cancelar fecha sem executar a ação', async () => {
      const cancel = await body.findByRole('button', { name: /Cancelar/i });
      await userEvent.click(cancel);
      await expect(onCancelSpy).toHaveBeenCalledTimes(1);
      await expect(onConfirmSpy).not.toHaveBeenCalled();
      // A saída também é animada: o painel só sai do DOM depois do animationend
      // (ou do fallback de tempo), não no clique.
      await waitFor(() => expect(body.queryByRole('alertdialog')).not.toBeInTheDocument());
    });

    await step('Space no Cancelar focado cancela pelo teclado', async () => {
      const trigger = canvas.getByRole('button', { name: /^Excluir$/i });
      await userEvent.click(trigger);

      const dialog = await waitForPortal('alertdialog');
      const cancel = within(dialog).getByRole('button', { name: /Cancelar/i });
      await waitFor(() => expect(cancel).toHaveFocus());

      await userEvent.keyboard(' ');
      await expect(onCancelSpy).toHaveBeenCalledTimes(2);
      await expect(onConfirmSpy).not.toHaveBeenCalled();
      await waitFor(() => expect(body.queryByRole('alertdialog')).not.toBeInTheDocument());
      await expect(trigger).toHaveFocus();
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
      onOpenChange: onOpenChangeSpy,
    });

    wrapper.append(dialog);
    return wrapper;
  },

  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    onOpenChangeSpy.mockClear();

    await step('Clique no trigger externo abre o diálogo e reporta a abertura', async () => {
      const trigger = canvas.getByRole('button', { name: /Abrir via estado externo/i });
      await userEvent.click(trigger);
      const dialog = await waitForPortal('alertdialog');
      // A entrada é animada (opacity 0 → 1): no primeiro quadro o painel já
      // está no DOM mas ainda conta como invisível.
      await waitFor(() => expect(dialog).toBeVisible());
      await expect(onOpenChangeSpy).toHaveBeenCalledWith(true);
    });

    await step('Escape fecha, reporta o fechamento e devolve o foco ao trigger', async () => {
      await userEvent.keyboard('{Escape}');
      await waitFor(() =>
        expect(body.queryByRole('alertdialog')).not.toBeInTheDocument(),
      );
      await expect(onOpenChangeSpy).toHaveBeenLastCalledWith(false);
      await expect(
        canvas.getByRole('button', { name: /Abrir via estado externo/i }),
      ).toHaveFocus();
    });
  },
};
