import type { Meta, StoryObj } from '@storybook/svelte';
import { userEvent, within, expect, fn } from 'storybook/test';
import { AlertDialog } from './index';
import AlertDialogStory from './AlertDialogStory.svelte';

const meta = {
  title: 'UI/AlertDialog/Estados',
  component: AlertDialog,
  tags: ['autodocs'],
  parameters: {
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
  render: () => ({
    Component: AlertDialogStory,
    props: {
      open: true,
      title: 'Confirmar exclusão',
      description: 'Esta ação é permanente.',
      actionLabel: 'Excluir',
      onConfirm: fn(),
    },
  }),
  play: async ({ step }) => {
    const body = within(document.body);
    await step('Clique em Excluir fecha o diálogo', async () => {
      const action = await body.findByRole('button', { name: /^Excluir$/i });
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
  render: () => ({
    Component: AlertDialogStory,
    props: {
      open: true,
      title: 'Confirmar exclusão',
      description: 'Esta ação é permanente.',
      actionLabel: 'Excluir',
      onCancel: fn(),
    },
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
    },
  }),
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
      await expect(body.queryByRole('alertdialog')).not.toBeInTheDocument();
    });
  },
};
