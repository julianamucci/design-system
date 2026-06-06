import type { Meta, StoryObj } from "@storybook/react";
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
import { AlertDialogDocs } from "@/components/docs/AlertDialogDocs";
import { withAutoDocsTab } from "@/lib/withAutoDocsTab";

const meta = {
  title: "UI/AlertDialog",
  component: AlertDialog,
  tags: ["autodocs", "overlay"],
  parameters: {
    docs: { page: withAutoDocsTab(AlertDialogDocs) },
  },
  argTypes: {
    defaultOpen: {
      control: "boolean",
      description: "Se o diálogo inicia aberto (útil para capturas visuais).",
    },
  },
} satisfies Meta<typeof AlertDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    defaultOpen: false,
  },
  render: (args) => {
    const onConfirm = fn();
    const onCancel = fn();
    return (
      <AlertDialog {...args}>
        <AlertDialogTrigger render={<Button variant="destructive" />}>
          Excluir conta
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir sua conta?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação é permanente. Todos os dados, arquivos e histórico serão removidos e não poderão ser recuperados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={onCancel}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={onConfirm}
            >
              Excluir conta
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);

    await step("Trigger está presente no DOM", async () => {
      const trigger = canvas.getByRole("button", { name: /Excluir conta/i });
      await expect(trigger).toBeInTheDocument();
    });

    await step("Diálogo abre ao clicar no trigger", async () => {
      const trigger = canvas.getByRole("button", { name: /Excluir conta/i });
      await userEvent.click(trigger);
      const dialog = await waitForPortal("alertdialog");
      await expect(dialog).toBeVisible();
    });

    await step("Diálogo tem role alertdialog", async () => {
      const dialog = await waitForPortal("alertdialog");
      await expect(dialog).toHaveAttribute("role", "alertdialog");
    });

    await step("Título e descrição são acessíveis", async () => {
      const dialog = await waitForPortal("alertdialog");
      await expect(dialog).toHaveAccessibleName(/Excluir sua conta/i);
      await expect(dialog).toHaveAccessibleDescription(/permanente/i);
    });

    await step("Escape fecha o diálogo", async () => {
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
