import type { Meta, StoryObj } from '@storybook/vue3';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from './index';
import { Button } from '@/components/ui/button';

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
    components: {
      AlertDialog,
      AlertDialogTrigger,
      AlertDialogContent,
      AlertDialogHeader,
      AlertDialogTitle,
      AlertDialogDescription,
      AlertDialogFooter,
      AlertDialogAction,
      AlertDialogCancel,
      Button,
    },
    setup() { return {}; },
    template: `
      <AlertDialog :default-open="true">
        <AlertDialogTrigger as-child>
          <Button variant="destructive">Excluir item</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir item selecionado</AlertDialogTitle>
            <AlertDialogDescription>
              O item será removido permanentemente da sua lista. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    `,
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
    components: {
      AlertDialog,
      AlertDialogTrigger,
      AlertDialogContent,
      AlertDialogHeader,
      AlertDialogTitle,
      AlertDialogDescription,
      AlertDialogFooter,
      AlertDialogAction,
      AlertDialogCancel,
      Button,
    },
    setup() { return {}; },
    template: `
      <AlertDialog :default-open="true">
        <AlertDialogTrigger as-child>
          <Button>Confirmar envio</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar envio do relatório</AlertDialogTitle>
            <AlertDialogDescription>
              O relatório será enviado para todos os destinatários da lista. Você poderá reenviar depois se necessário.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction>Enviar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    `,
  }),
};
