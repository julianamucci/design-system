import type { Meta, StoryObj } from '@storybook/svelte';
import { AlertDialog } from './index';
import AlertDialogStory from './AlertDialogStory.svelte';

const meta = {
  title: 'UI/AlertDialog/Variantes',
  component: AlertDialog,
} satisfies Meta<typeof AlertDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Destrutiva: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Use para ações que removem dados permanentemente. O botão de confirmação deve ter variante destructive.',
      },
    },
  },
  render: () => ({
    Component: AlertDialogStory,
    props: {
      triggerLabel: 'Excluir item',
      triggerVariant: 'destructive',
      title: 'Excluir item selecionado',
      description: 'O item será removido permanentemente da sua lista. Esta ação não pode ser desfeita.',
      cancelLabel: 'Cancelar',
      actionLabel: 'Excluir',
      defaultOpen: true,
    },
  }),
};

export const Neutra: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Use para confirmações de ações sem caráter destrutivo — envio de formulário, publicação, confirmação de pedido.',
      },
    },
  },
  render: () => ({
    Component: AlertDialogStory,
    props: {
      triggerLabel: 'Confirmar envio',
      triggerVariant: 'default',
      title: 'Confirmar envio do relatório',
      description: 'O relatório será enviado para todos os destinatários da lista. Você poderá reenviar depois se necessário.',
      cancelLabel: 'Cancelar',
      actionLabel: 'Enviar',
      defaultOpen: true,
    },
  }),
};
