import type { Meta, StoryObj } from "@storybook/react";
import { within, expect } from "storybook/test";
import { waitForPortal, waitForPortalGone } from "@/lib/wait-for-portal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./alert-dialog";
import { Button } from "./button";

const meta = {
  title: "UI/AlertDialog/Composicoes",
  tags: ["overlay"],
  component: AlertDialog,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          "Composicoes canônicas: confirmação destrutiva e confirmação neutra.",
      },
    },
  },
} satisfies Meta<typeof AlertDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Destrutiva: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Action com tokens `bg-destructive` + `text-destructive-foreground` e trigger `variant=destructive`. Use para ações irreversíveis.",
      },
    },
  },
  render: () => (
    <AlertDialog defaultOpen>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Excluir conta</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir sua conta?</AlertDialogTitle>
          <AlertDialogDescription>
            Essa ação é permanente. Todos os dados, arquivos e histórico serão removidos.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Excluir conta
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
  play: async () => {
    const body = within(document.body);
    const dialog = await waitForPortal("alertdialog");
    await expect(dialog).toBeVisible();
    const action = await waitForPortal("button", { name: /Excluir conta/i });
    await expect(action).toHaveClass("bg-destructive");
  },
};

export const Neutra: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Action com tokens padrão do Button. Use para confirmações que não são destrutivas (publicar, enviar, arquivar).",
      },
    },
  },
  render: () => (
    <AlertDialog defaultOpen>
      <AlertDialogTrigger asChild>
        <Button>Publicar agora</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Publicar este conteúdo?</AlertDialogTitle>
          <AlertDialogDescription>
            Ao publicar, o conteúdo fica visível para todos os usuários. Você poderá editá-lo depois.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Voltar</AlertDialogCancel>
          <AlertDialogAction>Publicar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
  play: async () => {
    const body = within(document.body);
    const dialog = await waitForPortal("alertdialog");
    await expect(dialog).toBeVisible();
    const action = await waitForPortal("button", { name: /^Publicar$/i });
    await expect(action).toBeVisible();
  },
};
