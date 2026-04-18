import type { Meta, StoryObj } from "@storybook/react";
import { fn, userEvent, within, expect } from "storybook/test";
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
import { Trash2 } from "lucide-react";
import { useState } from "react";

const meta = {
  title: "UI/AlertDialog/Composições",
  component: AlertDialog,
} satisfies Meta<typeof AlertDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TriggerPersonalizado: Story = {
  parameters: {
    docs: {
      description: {
        story: "Use asChild no AlertDialogTrigger para qualquer elemento como gatilho — link, ícone, item de menu.",
      },
    },
  },
  render: () => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <span
          role="button"
          tabIndex={0}
          className="text-sm text-destructive underline cursor-pointer hover:text-destructive/80"
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") e.currentTarget.click(); }}
        >
          Excluir conta
        </span>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir conta</AlertDialogTitle>
          <AlertDialogDescription>
            Todos os seus dados serão removidos permanentemente. Esta ação não pode ser desfeita.
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
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: "Excluir conta" });

    await step("Trigger personalizado está acessível", async () => {
      await expect(trigger).toBeInTheDocument();
    });

    await step("Clicar no trigger personalizado abre o modal", async () => {
      await userEvent.click(trigger);
      const dialog = await within(document.body).findByRole("alertdialog");
      await expect(dialog).toBeVisible();
    });

    await step("Fechar modal via Cancelar", async () => {
      const cancelBtn = within(document.body).getByRole("button", { name: "Cancelar" });
      await userEvent.click(cancelBtn);
      await expect(within(document.body).queryByRole("alertdialog")).not.toBeInTheDocument();
    });
  },
};

export const ComIcone: Story = {
  parameters: {
    docs: {
      description: {
        story: "Trigger com ícone — útil em tabelas ou listas de ações. O aria-label garante acessibilidade.",
      },
    },
  },
  render: () => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Excluir item">
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
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
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: "Excluir item" });

    await step("Trigger ícone tem aria-label acessível", async () => {
      await expect(trigger).toBeInTheDocument();
      await expect(trigger).toHaveAttribute("aria-label", "Excluir item");
    });

    await step("Clicar no ícone abre o modal", async () => {
      await userEvent.click(trigger);
      const dialog = await within(document.body).findByRole("alertdialog");
      await expect(dialog).toBeVisible();
    });

    await step("Fechar modal via Cancelar", async () => {
      const cancelBtn = within(document.body).getByRole("button", { name: "Cancelar" });
      await userEvent.click(cancelBtn);
      await expect(within(document.body).queryByRole("alertdialog")).not.toBeInTheDocument();
    });
  },
};

function ControlledDemo() {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Estado: <strong>{open ? "aberto" : "fechado"}</strong>
      </p>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger asChild>
          <Button variant="outline">Abrir modal controlado</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar ação</AlertDialogTitle>
            <AlertDialogDescription>
              Este modal usa estado controlado via open/onOpenChange.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export const ControlledState: Story = {
  parameters: {
    docs: {
      description: {
        story: "Modo controlado usando open e onOpenChange — útil quando a abertura depende de lógica externa.",
      },
    },
  },
  render: () => <ControlledDemo />,
};
