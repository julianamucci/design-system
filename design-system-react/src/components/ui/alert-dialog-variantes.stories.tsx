import type { Meta, StoryObj } from "@storybook/react";
import { Trash2, LogOut, ShieldAlert } from "lucide-react";
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
  title: "UI/Alert Dialog/Variantes",
  component: AlertDialog,
  argTypes: {
    onOpenChange: { action: "openChanged" },
  },
} satisfies Meta<typeof AlertDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Story para confirmação de exclusão permanente.
 * 
 * @summary Confirmação de exclusão (Ação destrutiva).
 */
export const Exclusao: Story = {
  name: "Exclusão",
  render: (args) => (
    <AlertDialog {...args}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">
          <Trash2 className="h-4 w-4" />
          Excluir projeto
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir projeto?</AlertDialogTitle>
          <AlertDialogDescription>
            Todos os arquivos, histórico e configurações serão removidos permanentemente. Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Sim, excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
  parameters: {
    docs: {
      description: {
        story: "Padrão para confirmar exclusão permanente de recursos. O botão Action usa a variante destructive para reforçar a gravidade da ação.",
      },
    },
  },
};

/**
 * Story para confirmação de encerramento de sessão.
 * 
 * @summary Confirmação de logout.
 */
export const Logout: Story = {
  name: "Logout",
  render: (args) => (
    <AlertDialog {...args}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost">
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Encerrar sessão?</AlertDialogTitle>
          <AlertDialogDescription>
            Você será deslogado de todos os dispositivos. Dados não salvos serão perdidos.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Ficar</AlertDialogCancel>
          <AlertDialogAction>Sair</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
  parameters: {
    docs: {
      description: {
        story: "Confirmação de logout. O botão Action usa o estilo padrão (não-destrutivo) porque a ação é reversível — o usuário pode fazer login novamente.",
      },
    },
  },
};

/**
 * Story para confirmação de ações que resetam configurações ou afetam o sistema globalmente.
 * 
 * @summary Confirmação de ação crítica.
 */
export const AcaoCritica: Story = {
  name: "Ação crítica",
  render: (args) => (
    <AlertDialog {...args}>
      <AlertDialogTrigger asChild>
        <Button variant="outline">
          <ShieldAlert className="h-4 w-4" />
          Resetar configurações
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Resetar todas as configurações?</AlertDialogTitle>
          <AlertDialogDescription>
            Todas as configurações personalizadas voltarão aos valores padrão de fábrica. Integrações e webhooks serão desconectados.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Manter</AlertDialogCancel>
          <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Resetar tudo
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
  parameters: {
    docs: {
      description: {
        story: "Confirmação de operações de alto impacto no sistema que afetam múltiplas configurações ou integrações simultaneamente.",
      },
    },
  },
};
