import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, within, expect, fn, waitFor } from "storybook/test";
import { waitForPortal } from "@/lib/wait-for-portal";
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
  // A aba "API Reference" combina o docgen com estes argTypes. Props que o
  // render não encaminha ficam como documentação (control: false).
  argTypes: {
    defaultOpen: {
      control: "boolean",
      description: "Estado inicial em modo não controlado. Útil para capturas visuais.",
      table: { type: { summary: "boolean" }, defaultValue: { summary: "false" } },
    },
    open: {
      control: false,
      description: "Estado controlado de abertura. Use com onOpenChange.",
      table: { type: { summary: "boolean" } },
    },
    onOpenChange: {
      control: false,
      description: "Disparado ao abrir ou fechar. Recebe o novo estado e os detalhes do evento.",
      table: { type: { summary: "(open, eventDetails) => void" } },
    },
    onOpenChangeComplete: {
      control: false,
      description: "Disparado quando a animação de abertura ou fechamento termina.",
      table: { type: { summary: "(open: boolean) => void" } },
    },
    children: {
      control: false,
      description: "Composição: Trigger, Content, Header, Footer, Cancel e Action.",
      table: { type: { summary: "ReactNode" } },
    },
  },
  args: {
    defaultOpen: false,
  },
} satisfies Meta<typeof AlertDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
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
              variant="destructive"
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
          const dialog = within(document.body).queryByRole("alertdialog");
          if (dialog && dialog.getAttribute("data-state") !== "closed") {
            throw new Error("dialog still open");
          }
        },
        { timeout: 500 }
      );
    });
  },
};
