import type { Meta, StoryObj } from "@storybook/react";
import { Trash2, Loader2 } from "lucide-react";
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
  title: "UI/Alert Dialog/Composições",
  component: AlertDialog,
  argTypes: {
    onOpenChange: { action: "openChanged" },
  },
} satisfies Meta<typeof AlertDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ComIconeNoTrigger: Story = {
  name: "Com ícone no Trigger",
  render: (args) => (
    <AlertDialog {...args}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">
          <Trash2 className="h-4 w-4" />
          Excluir arquivo
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir arquivo?</AlertDialogTitle>
          <AlertDialogDescription>
            O arquivo será movido para a lixeira e excluído permanentemente após 30 dias.
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
        story: "Trigger com ícone + label. Use `asChild` para renderizar um Button do Design System como trigger, preservando variantes e ícones.",
      },
    },
  },
};

export const ComLoadingNoAction: Story = {
  name: "Com loading no Action",
  render: (args) => (
    <AlertDialog {...args} defaultOpen>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Excluir</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluindo conta...</AlertDialogTitle>
          <AlertDialogDescription>
            Aguarde enquanto removemos seus dados.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled>Cancelar</AlertDialogCancel>
          <AlertDialogAction disabled className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            <Loader2 className="h-4 w-4 animate-spin" />
            Excluindo...
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
  parameters: {
    docs: {
      description: {
        story: "Estado de loading dentro do diálogo. Ambos os botões ficam `disabled` durante a operação assíncrona, impedindo ações acidentais. Use o modo controlado (`open` + `onOpenChange`) para implementar esse padrão.",
      },
    },
  },
};

export const DescricaoLonga: Story = {
  name: "Descrição longa",
  render: (args) => (
    <AlertDialog {...args}>
      <AlertDialogTrigger asChild>
        <Button variant="outline">Cancelar assinatura</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancelar sua assinatura Pro?</AlertDialogTitle>
          <AlertDialogDescription>
            Ao cancelar, você perderá acesso a: armazenamento ilimitado, suporte prioritário, integrações avançadas e analytics em tempo real. Seus dados serão mantidos por 90 dias, após esse período serão excluídos permanentemente. Você pode reativar a qualquer momento durante o período de retenção.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Manter assinatura</AlertDialogCancel>
          <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Cancelar assinatura
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
  parameters: {
    docs: {
      description: {
        story: "Quando a consequência da ação é complexa, a descrição pode ser mais longa. O Content se ajusta automaticamente ao conteúdo com `max-w-lg`.",
      },
    },
  },
};
