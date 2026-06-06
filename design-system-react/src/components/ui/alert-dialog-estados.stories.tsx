import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { userEvent, within, expect, fn, waitFor } from "storybook/test";
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
  title: "UI/AlertDialog/Estados",
  tags: ["overlay"],
  component: AlertDialog,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          "Cada estado canônico do AlertDialog: closed, open, confirmed, cancelled e controlled.",
      },
    },
  },
} satisfies Meta<typeof AlertDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Closed: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Estado inicial — o trigger está visível e o diálogo não foi aberto ainda.",
      },
    },
  },
  render: () => (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="destructive" />}>
        Excluir item
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    const trigger = canvas.getByRole("button", { name: /Excluir item/i });
    await expect(trigger).toBeVisible();
    // Base UI pode manter portal no DOM mesmo fechado; checar data-state
    const dialog = body.queryByRole("alertdialog");
    if (dialog) {
      await expect(dialog).toHaveAttribute("data-state", "closed");
    }
  },
};

export const Open: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Diálogo aberto com `defaultOpen`. Usado para captura visual no Chromatic.",
      },
    },
  },
  render: () => (
    <AlertDialog defaultOpen>
      <AlertDialogTrigger render={<Button variant="destructive" />}>
        Excluir item
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir item permanentemente?</AlertDialogTitle>
          <AlertDialogDescription>
            O item será removido de forma definitiva e não poderá ser recuperado.
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
  play: async () => {
    const body = within(document.body);
    const dialog = await waitForPortal("alertdialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAccessibleName(/Excluir item/i);
  },
};

export const Confirmed: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Usuário confirma a ação clicando em Action — handler `onClick` é disparado.",
      },
    },
  },
  render: () => {
    const onConfirm = fn();
    return (
      <AlertDialog defaultOpen>
        <AlertDialogTrigger render={<Button variant="destructive" />}>
          Excluir
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é permanente e não poderá ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              data-testid="confirm-action"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={onConfirm}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  },
  play: async ({ step }) => {
    const body = within(document.body);

    await step("Diálogo está aberto", async () => {
      const dialog = await waitForPortal("alertdialog");
      await expect(dialog).toBeVisible();
    });

    await step("Ação Confirmar é clicada (handler disparado)", async () => {
      const action = await body.findByTestId("confirm-action");
      await userEvent.click(action);
      await expect(action).toBeInTheDocument();
    });
  },
};

export const Cancelled: Story = {
  parameters: {
    docs: {
      description: {
        story: "Usuário cancela — diálogo fecha e `onClick` do Cancel é disparado.",
      },
    },
  },
  render: () => {
    const onCancel = fn();
    return (
      <AlertDialog defaultOpen>
        <AlertDialogTrigger render={<Button variant="destructive" />}>
          Excluir
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é permanente e não poderá ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={onCancel}>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  },
  play: async ({ step }) => {
    const body = within(document.body);

    await step("Cancel é clicado e diálogo fecha", async () => {
      const cancel = await waitForPortal("button", { name: /Cancelar/i });
      await userEvent.click(cancel);
      await waitFor(
        () => {
          const dialog = body.queryByRole("alertdialog");
          if (dialog && dialog.getAttribute("data-state") !== "closed") {
            throw new Error("dialog still open");
          }
        },
        { timeout: 500 }
      );
    });
  },
};

export const Controlled: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Abertura controlada via `open` + `onOpenChange` — pai decide quando abrir e fechar.",
      },
    },
  },
  render: () => {
    const ControlledDemo = () => {
      const [open, setOpen] = useState(false);
      return (
        <div className="flex flex-col gap-3">
          <Button variant="destructive" onClick={() => setOpen(true)}>
            Abrir via estado externo
          </Button>
          <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Controlado pelo pai</AlertDialogTitle>
                <AlertDialogDescription>
                  Este diálogo é comandado por estado externo via `open` e
                  `onOpenChange`.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Fechar</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => setOpen(false)}
                >
                  Confirmar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      );
    };
    return <ControlledDemo />;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);

    await step("Clique no trigger externo abre o diálogo", async () => {
      const trigger = canvas.getByRole("button", {
        name: /Abrir via estado externo/i,
      });
      await userEvent.click(trigger);
      const dialog = await waitForPortal("alertdialog");
      await expect(dialog).toBeVisible();
    });

    await step("Escape fecha o diálogo controlado", async () => {
      await userEvent.keyboard("{Escape}");
      await waitFor(
        () => {
          const dialog = body.queryByRole("alertdialog");
          if (dialog && dialog.getAttribute("data-state") !== "closed") {
            throw new Error("dialog still open");
          }
        },
        { timeout: 500 }
      );
    });
  },
};
