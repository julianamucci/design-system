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
import { AlertDialogDocs } from "@/components/docs/AlertDialogDocs";
import { withAutoDocsTab } from "@/lib/withAutoDocsTab";

const meta = {
  title: "UI/AlertDialog",
  component: AlertDialog,
  tags: ["autodocs"],
  parameters: {
    docs: { page: withAutoDocsTab(AlertDialogDocs) },
  },
  argTypes: {
    open: {
      control: "boolean",
      description: "Controla o estado aberto/fechado de forma controlada",
    },
    defaultOpen: {
      control: "boolean",
      description: "Estado aberto inicial quando não controlado",
    },
  },
  args: {
    defaultOpen: false,
  },
} satisfies Meta<typeof AlertDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <AlertDialog {...args}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Excluir conta</Button>
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
          <AlertDialogAction onClick={fn()}>Excluir</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: "Excluir conta" });

    await step("Trigger está acessível e habilitado", async () => {
      await expect(trigger).toBeInTheDocument();
      await expect(trigger).toBeEnabled();
    });

    await step("Trigger recebe foco via teclado", async () => {
      trigger.focus();
      await expect(trigger).toHaveFocus();
    });

    await step("Clicar no trigger abre o modal", async () => {
      await userEvent.click(trigger);
      const dialog = await within(document.body).findByRole("alertdialog");
      await expect(dialog).toBeVisible();
    });

    await step("Modal tem role alertdialog e título correto", async () => {
      const dialog = within(document.body).getByRole("alertdialog");
      await expect(dialog).toHaveAttribute("role", "alertdialog");
      await expect(within(document.body).getByText("Excluir conta")).toBeVisible();
    });

    await step("Cancelar fecha o modal", async () => {
      const cancelBtn = within(document.body).getByRole("button", { name: "Cancelar" });
      await userEvent.click(cancelBtn);
      await expect(within(document.body).queryByRole("alertdialog")).not.toBeInTheDocument();
    });
  },
};
