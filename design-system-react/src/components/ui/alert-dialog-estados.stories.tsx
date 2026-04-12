import type { Meta, StoryObj } from "@storybook/react";
import { Loader2 } from "lucide-react";
import { Button } from "./button";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "./alert-dialog";

const meta = {
  title: "UI/Alert Dialog/Estados",
  component: AlertDialog,
  argTypes: {
    onOpenChange: { action: "openChanged" },
  },
} satisfies Meta<typeof AlertDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Aberto: Story = {
  name: "Aberto por padrão",
  render: (args) => (
    <AlertDialog {...args} defaultOpen>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Excluir</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir item?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
  parameters: {
    docs: {
      description: {
        story: "Diálogo renderizado em estado aberto via `defaultOpen`. Útil para documentação e testes visuais.",
      },
    },
  },
};

export const Loading: Story = {
  name: "Loading",
  render: (args) => (
    <AlertDialog {...args} defaultOpen>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Excluir</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluindo...</AlertDialogTitle>
          <AlertDialogDescription>
            Aguarde enquanto processamos sua solicitação.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled>Cancelar</AlertDialogCancel>
          <AlertDialogAction disabled className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            <Loader2 className="h-4 w-4 animate-spin" />
            Processando...
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
  parameters: {
    docs: {
      description: {
        story: "Estado de carregamento durante uma operação assíncrona. Ambos os botões ficam `disabled` para impedir ações acidentais.",
      },
    },
  },
};
