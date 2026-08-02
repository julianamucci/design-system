import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { userEvent, within, expect, waitFor, fn } from 'storybook/test';
import { AlertDialog } from './index';
import AlertDialogStory from './AlertDialogStory.svelte';

const meta = {
  title: 'UI/AlertDialog/Estados',
  component: AlertDialog,
  tags: ['overlay'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      description: {
        component:
          'Cada estado canônico do AlertDialog: closed, open, confirmed, cancelled e controlled.',
      },
    },
  },
} satisfies Meta<typeof AlertDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

// Enquanto o diálogo está aberto o bits-ui neutraliza o resto da página com
// `pointer-events: none`, e só devolve a interação depois da saída. Reabrir o
// diálogo no passo seguinte exige esperar essa liberação, senão o clique falha
// com "element has pointer-events: none".
async function waitForInteractive(el: HTMLElement) {
  await waitFor(() => {
    if (getComputedStyle(el).pointerEvents === 'none') {
      throw new Error('trigger ainda inerte (pointer-events: none)');
    }
  });
}

export const Closed: Story = {
  parameters: {
    docs: {
      description: { story: 'Estado inicial — apenas o trigger é visível.' },
    },
  },
  render: () => ({
    Component: AlertDialogStory,
    props: {
      open: false,
      triggerLabel: 'Excluir item',
      title: 'Confirmar exclusão',
      description: 'Esta ação não pode ser desfeita.',
      actionLabel: 'Excluir',
    },
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
        story: 'Diálogo aberto com `open`. Captura visual no Chromatic.',
      },
    },
  },
  render: () => ({
    Component: AlertDialogStory,
    props: {
      open: true,
      triggerLabel: 'Excluir item',
      title: 'Excluir item permanentemente?',
      description: 'O item será removido de forma definitiva e não poderá ser recuperado.',
      actionLabel: 'Excluir',
    },
  }),
  play: async ({ step }) => {
    const body = within(document.body);

    await step('Diálogo renderiza aberto com o conteúdo acessível', async () => {
      const dialog = await body.findByRole('alertdialog');
      await expect(dialog).toBeVisible();
      await expect(dialog).toHaveAccessibleName(/Excluir item permanentemente/i);
    });

    // O overlay do alertdialog é inerte por decisão de acessibilidade (WAI-ARIA
    // APG: a decisão precisa ser explícita), então clicar fora NÃO cancela.
    await step('Clique no overlay não fecha o diálogo', async () => {
      const overlay = document.querySelector<HTMLElement>('[data-slot="alert-dialog-overlay"]');
      await expect(overlay).toBeInTheDocument();
      await userEvent.click(overlay!);
      await expect(await body.findByRole('alertdialog')).toBeVisible();
    });
  },
};

// Spy no escopo do módulo: o `play` precisa asseverar o callback do consumidor,
// e o objeto de props montado em `render` não é visível dentro do `play`.
const onConfirmSpy = fn();

export const Confirmed: Story = {
  parameters: {
    docs: {
      description: { story: 'Clique em Action dispara o handler e fecha o diálogo.' },
    },
  },
  render: () => ({
    Component: AlertDialogStory,
    props: {
      open: false,
      triggerLabel: 'Excluir item',
      title: 'Confirmar exclusão',
      description: 'Esta ação é permanente.',
      cancelLabel: 'Cancelar',
      actionLabel: 'Excluir',
      onConfirm: onConfirmSpy,
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    onConfirmSpy.mockClear();

    await step('Trigger abre o diálogo', async () => {
      await userEvent.click(canvas.getByRole('button', { name: /Excluir item/i }));
      const dialog = await body.findByRole('alertdialog');
      await expect(dialog).toBeVisible();
    });

    await step('Clique em Excluir dispara o handler do consumidor', async () => {
      const action = await body.findByRole('button', { name: /^Excluir$/i });
      await userEvent.click(action);
      await waitFor(() => expect(onConfirmSpy).toHaveBeenCalledTimes(1));
    });

    await step('Confirmar fecha o diálogo e devolve o foco ao trigger', async () => {
      await waitFor(() => expect(body.queryByRole('alertdialog')).not.toBeInTheDocument());
      const trigger = canvas.getByRole('button', { name: /Excluir item/i });
      await waitFor(() => expect(trigger).toHaveFocus());
    });

    await step('Enter com a ação focada também confirma', async () => {
      const trigger = canvas.getByRole('button', { name: /Excluir item/i });
      await waitForInteractive(trigger);
      await userEvent.click(trigger);
      const dialog = await body.findByRole('alertdialog');
      // O foco inicial é assíncrono (vai para o painel); só depois dele o Tab
      // percorre Cancelar → ação na ordem documentada.
      await waitFor(() => expect(dialog).toHaveFocus());
      await userEvent.tab();
      await userEvent.tab();
      const action = within(dialog).getByRole('button', { name: /^Excluir$/i });
      await expect(action).toHaveFocus();
      await userEvent.keyboard('{Enter}');
      await waitFor(() => expect(onConfirmSpy).toHaveBeenCalledTimes(2));
      await waitFor(() => expect(body.queryByRole('alertdialog')).not.toBeInTheDocument());
    });
  },
};

const onCancelSpy = fn();
const onCancelledConfirmSpy = fn();

export const Cancelled: Story = {
  parameters: {
    docs: {
      description: { story: 'Cancel é clicado — diálogo fecha sem executar ação.' },
    },
  },
  render: () => ({
    Component: AlertDialogStory,
    props: {
      open: true,
      triggerLabel: 'Excluir item',
      title: 'Confirmar exclusão',
      description: 'Esta ação é permanente.',
      cancelLabel: 'Cancelar',
      actionLabel: 'Excluir',
      onCancel: onCancelSpy,
      onConfirm: onCancelledConfirmSpy,
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    onCancelSpy.mockClear();
    onCancelledConfirmSpy.mockClear();

    await step('Clique em Cancelar fecha o diálogo sem executar a ação', async () => {
      const cancel = await body.findByRole('button', { name: /Cancelar/i });
      await userEvent.click(cancel);
      await waitFor(() => expect(body.queryByRole('alertdialog')).not.toBeInTheDocument());
      await expect(onCancelSpy).toHaveBeenCalledTimes(1);
      await expect(onCancelledConfirmSpy).not.toHaveBeenCalled();
    });

    await step('Espaço com Cancelar focado também cancela', async () => {
      const trigger = canvas.getByRole('button', { name: /Excluir item/i });
      await waitForInteractive(trigger);
      await userEvent.click(trigger);
      const dialog = await body.findByRole('alertdialog');
      // O foco inicial é assíncrono (vai para o painel); o primeiro Tab leva ao
      // Cancelar, conforme a ordem documentada.
      await waitFor(() => expect(dialog).toHaveFocus());
      await userEvent.tab();
      const cancel = within(dialog).getByRole('button', { name: /Cancelar/i });
      await expect(cancel).toHaveFocus();
      await userEvent.keyboard(' ');
      await waitFor(() => expect(onCancelSpy).toHaveBeenCalledTimes(2));
      await waitFor(() => expect(body.queryByRole('alertdialog')).not.toBeInTheDocument());
      await expect(onCancelledConfirmSpy).not.toHaveBeenCalled();
    });
  },
};

const onOpenChangeSpy = fn();

export const Controlled: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Abertura controlada por estado externo via `bind:open`.',
      },
    },
  },
  render: () => ({
    Component: AlertDialogStory,
    props: {
      open: false,
      triggerLabel: 'Abrir via estado externo',
      title: 'Controlado pelo pai',
      description: 'Este diálogo é comandado por estado externo via bind:open.',
      cancelLabel: 'Fechar',
      actionLabel: 'Confirmar',
      onOpenChange: onOpenChangeSpy,
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    onOpenChangeSpy.mockClear();

    await step('Clique no trigger externo abre e propaga o novo estado', async () => {
      const trigger = canvas.getByRole('button', { name: /Abrir via estado externo/i });
      await userEvent.click(trigger);
      const dialog = await body.findByRole('alertdialog');
      await expect(dialog).toBeVisible();
      await expect(onOpenChangeSpy).toHaveBeenCalledWith(true);
    });

    await step('Escape fecha o diálogo controlado e propaga o novo estado', async () => {
      await userEvent.keyboard('{Escape}');
      await waitFor(() => expect(body.queryByRole('alertdialog')).not.toBeInTheDocument());
      await expect(onOpenChangeSpy).toHaveBeenCalledWith(false);
    });
  },
};
