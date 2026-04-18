import type { Meta, StoryObj } from "@storybook/react";
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
} from "./alert-dialog";
import { Button } from "./button";
import { buttonVariants } from "./button";

const meta = {
  title: "UI/AlertDialog/Variantes",
  component: AlertDialog,
} satisfies Meta<typeof AlertDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Destrutiva: Story = {
  parameters: {
    docs: {
      description: {
        story: "Use para ações que removem dados permanentemente. O botão de confirmação deve ter variante destructive.",
      },
    },
  },
  render: () => (
    <AlertDialog defaultOpen>
      <AlertDialogTrigger asChild>
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
          <AlertDialogAction className={buttonVariants({ variant: "destructive" })}>
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
};

export const Neutra: Story = {
  parameters: {
    docs: {
      description: {
        story: "Use para confirmações de ações sem caráter destrutivo — envio de formulário, publicação, confirmação de pedido.",
      },
    },
  },
  render: () => (
    <AlertDialog defaultOpen>
      <AlertDialogTrigger asChild>
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
  ),
};
