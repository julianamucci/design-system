import type { Meta, StoryObj } from "@storybook/react";
import { fn, userEvent, within, expect } from "storybook/test";
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
import { AlertDialogDocs } from "@/components/docs/AlertDialogDocs";
import { withAutoDocsTab } from "@/lib/withAutoDocsTab";

// ─── Meta compartilhado ──────────────────────────────────────────────────────

const meta = {
  title: "UI/Alert Dialog",
  component: AlertDialog,
  tags: ["autodocs"],
  parameters: {
    docs: { page: withAutoDocsTab(AlertDialogDocs) },
  },
  argTypes: {
    open: {
      control: "boolean",
      description: "Controla o estado aberto/fechado do diálogo (modo controlado)",
    },
    defaultOpen: {
      control: "boolean",
      description: "Estado inicial do diálogo (modo não-controlado)",
    },
    onOpenChange: { action: "openChanged" },
  },
  args: {
    onOpenChange: fn(),
  },
} satisfies Meta<typeof AlertDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Playground ──────────────────────────────────────────────────────────────

/**
 * O Playground demonstra o ciclo de vida completo do AlertDialog:
 * disparo, exibição do modal, trap de foco e retorno ao trigger.
 * 
 * @summary Demonstração interativa do AlertDialog.
 */
export const Playground: Story = {
  render: (args) => (
    <AlertDialog {...args}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Excluir conta</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Tem certeza absoluta?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação não pode ser desfeita. Isso excluirá permanentemente sua conta e removerá todos os seus dados de nossos servidores.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Sim, excluir conta
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: /excluir conta/i });

    // Critério 1 — Clicar no Trigger abre o diálogo
    await step("Clica no Trigger → diálogo abre", async () => {
      await userEvent.click(trigger);
      const dialog = await within(document.body).findByRole("alertdialog");
      await expect(dialog).toBeInTheDocument();
    });

    // Critério 2 — Título e descrição são anunciados
    await step("Verifica aria-labelledby e aria-describedby", async () => {
      const dialog = within(document.body).getByRole("alertdialog");
      await expect(dialog).toHaveAttribute("aria-labelledby");
      await expect(dialog).toHaveAttribute("aria-describedby");
    });

    // Critério 3 — Focus trap: foco permanece dentro do diálogo
    await step("Focus trap — foco não sai do diálogo ao navegar com Tab", async () => {
      const dialog = within(document.body).getByRole("alertdialog");
      const cancelBtn = within(document.body).getByRole("button", { name: /cancelar/i });
      const actionBtn = within(document.body).getByRole("button", { name: /sim, excluir conta/i });

      // Foco no Cancel → Tab → deve ir para Action (ou vice-versa), nunca para fora
      cancelBtn.focus();
      await expect(cancelBtn).toHaveFocus();

      await userEvent.tab();
      // Foco deve estar no Action ou voltar pro Cancel (focus trap)
      const activeAfterTab = document.activeElement;
      await expect(dialog.contains(activeAfterTab)).toBe(true);

      await userEvent.tab();
      const activeAfterTab2 = document.activeElement;
      await expect(dialog.contains(activeAfterTab2)).toBe(true);
    });

    // Critério 4 — Clicar em Cancel fecha o diálogo
    await step("Clica em Cancel → diálogo fecha", async () => {
      const cancelBtn = within(document.body).getByRole("button", { name: /cancelar/i });
      await userEvent.click(cancelBtn);
      const dialogs = within(document.body).queryAllByRole("alertdialog");
      await expect(dialogs.length).toBe(0);
    });

    // Critério 5 — Foco retorna ao Trigger após fechar
    await step("Foco retorna ao Trigger", async () => {
      await expect(trigger).toHaveFocus();
    });
  },
  parameters: {
    docs: {
      description: {
        story: "Cobre os 5 critérios de acessibilidade verificável: abertura, aria attributes, focus trap, fechamento via Cancel e retorno de foco. Veja a aba **Interactions**.",
      },
    },
  },
};
