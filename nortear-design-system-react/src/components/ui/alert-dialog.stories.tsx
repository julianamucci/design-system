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
    actionsRef: {
      control: false,
      description:
        "Ref para ações imperativas: fechar o diálogo ou desmontá-lo após uma animação controlada externamente.",
      table: { type: { summary: "RefObject<{ close(): void; unmount(): void }>" } },
    },
    handle: {
      control: false,
      description:
        "Identificador criado por createHandle() que permite comandar o diálogo a partir de um trigger externo à raiz.",
      table: { type: { summary: "AlertDialogHandle<Payload>" } },
    },
    triggerId: {
      control: false,
      description:
        "ID do trigger associado ao diálogo. Usado junto do estado controlado para indicar qual trigger o abriu.",
      table: { type: { summary: "string | null" } },
    },
    defaultTriggerId: {
      control: false,
      description: "ID do trigger associado quando o diálogo já inicia aberto.",
      table: { type: { summary: "string | null" } },
    },
    children: {
      control: false,
      description: "Composição: Trigger, Content, Header, Footer, Cancel e Action.",
      table: { type: { summary: "ReactNode" } },
    },
  },
  args: {
    defaultOpen: false,
    onOpenChange: fn(),
  },
} satisfies Meta<typeof AlertDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

// Mesmos rótulos da seção Demonstração / variante destructive da docs page.
export const Playground: Story = {
  render: (args) => (
    <AlertDialog {...args}>
      <AlertDialogTrigger render={<Button variant="destructive" />}>
        Excluir conta
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
          <AlertDialogAction variant="destructive">Excluir</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const onOpenChange = args.onOpenChange as unknown as ReturnType<typeof fn>;
    const openedWith = (open: boolean) =>
      onOpenChange.mock.calls.some((call) => call[0] === open);

    await step("Trigger está presente no DOM", async () => {
      const trigger = canvas.getByRole("button", { name: /^Excluir conta$/i });
      await expect(trigger).toBeInTheDocument();
    });

    await step("Diálogo abre ao clicar no trigger", async () => {
      const trigger = canvas.getByRole("button", { name: /^Excluir conta$/i });
      await userEvent.click(trigger);
      const dialog = await waitForPortal("alertdialog");
      await expect(dialog).toBeVisible();
      await waitFor(() => expect(openedWith(true)).toBe(true));
    });

    await step("Diálogo tem role alertdialog e isola o fundo de leitores de tela", async () => {
      const dialog = await waitForPortal("alertdialog");
      await expect(dialog).toHaveAttribute("role", "alertdialog");
      // A lib não emite `aria-modal`: marca tudo fora do popup com
      // aria-hidden + data-base-ui-inert, que entrega o mesmo isolamento.
      const trigger = canvasElement.querySelector('[data-slot="alert-dialog-trigger"]');
      await expect(trigger).not.toBeNull();
      await expect(trigger!.closest('[aria-hidden="true"]')).not.toBeNull();
    });

    await step("aria-labelledby aponta para o Title e aria-describedby para a Description", async () => {
      const dialog = await waitForPortal("alertdialog");
      const title = dialog.querySelector<HTMLElement>('[data-slot="alert-dialog-title"]');
      const description = dialog.querySelector<HTMLElement>(
        '[data-slot="alert-dialog-description"]',
      );
      await expect(title).not.toBeNull();
      await expect(description).not.toBeNull();
      await expect(title!.id).not.toBe("");
      await expect(description!.id).not.toBe("");
      await expect(dialog).toHaveAttribute("aria-labelledby", title!.id);
      await expect(dialog).toHaveAttribute("aria-describedby", description!.id);
      await expect(title).toHaveTextContent("Excluir conta");
      await expect(description).toHaveTextContent(/removidos permanentemente/i);
    });

    await step("Foco entra no diálogo ao abrir", async () => {
      const dialog = await waitForPortal("alertdialog");
      await waitFor(() => {
        if (!dialog.contains(document.activeElement)) {
          throw new Error("foco não entrou no diálogo");
        }
      });
    });

    await step("Tab e Shift+Tab circulam entre Cancel e Action sem sair do diálogo", async () => {
      const dialog = await waitForPortal("alertdialog");
      const cancel = within(dialog).getByRole("button", { name: /^Cancelar$/i });
      const action = within(dialog).getByRole("button", { name: /^Excluir$/i });
      const focused = new Set<Element>();

      // 4 tabulações: com focus trap ativo o foco só pode alternar entre os
      // dois botões (ou o próprio popup, que tem tabindex -1).
      for (let i = 0; i < 4; i += 1) {
        await userEvent.tab();
        await waitFor(() => {
          if (!dialog.contains(document.activeElement)) {
            throw new Error(
              `foco escapou do diálogo para <${document.activeElement?.tagName}>`,
            );
          }
        });
        focused.add(document.activeElement!);
      }
      await expect(focused.has(cancel)).toBe(true);
      await expect(focused.has(action)).toBe(true);

      await userEvent.tab({ shift: true });
      await waitFor(() => {
        if (!dialog.contains(document.activeElement)) {
          throw new Error("Shift+Tab tirou o foco do diálogo");
        }
      });
    });

    await step("Clique no overlay não fecha (dismissal desabilitado no alert dialog)", async () => {
      const dialog = await waitForPortal("alertdialog");
      const overlay = document.querySelector<HTMLElement>(
        '[data-slot="alert-dialog-overlay"]',
      );
      await expect(overlay).not.toBeNull();
      overlay!.click();
      await expect(dialog).toBeVisible();
      await expect(openedWith(false)).toBe(false);
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
      await waitFor(() => expect(openedWith(false)).toBe(true));
    });

    await step("Foco retorna ao trigger após fechar", async () => {
      const trigger = canvas.getByRole("button", { name: /^Excluir conta$/i });
      await waitFor(() => expect(trigger).toHaveFocus());
    });
  },
};
