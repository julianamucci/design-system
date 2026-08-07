import type { ComponentProps } from "react";
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
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./alert-dialog";
import { Button } from "./button";
import { TriangleAlert } from "lucide-react";
import { AlertDialogDocs } from "@/components/docs/AlertDialogDocs";
import { withAutoDocsTab } from "@/lib/withAutoDocsTab";

// Args da raiz + args que montam a composição. Os segundos ficam na categoria
// "Demonstração" — mesmos nomes, ordem e valores nas 4 stacks, para o painel de
// controls ser o mesmo em qualquer Storybook do design system.
type PlaygroundArgs = ComponentProps<typeof AlertDialog> & {
  tone: "destructive" | "default";
  showMedia: boolean;
  triggerLabel: string;
  title: string;
  description: string;
  cancelLabel: string;
  actionLabel: string;
};

const DEMO = { table: { category: "Demonstração" } } as const;

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

    tone: {
      control: "select",
      options: ["destructive", "default"],
      description: "Severidade da confirmação — escolhe a variante do Button do trigger e da ação.",
      ...DEMO,
    },
    showMedia: {
      control: "boolean",
      description:
        "Bloco de ícone no topo do header (AlertDialogMedia). Quando presente, o CSS centraliza header e texto.",
      ...DEMO,
    },
    triggerLabel: { control: "text", description: "Rótulo do botão que abre o diálogo.", ...DEMO },
    title: { control: "text", description: "Título, associado por aria-labelledby.", ...DEMO },
    description: {
      control: "text",
      description: "Descrição, associada por aria-describedby.",
      ...DEMO,
    },
    cancelLabel: {
      control: "text",
      description: "Rótulo do botão que fecha sem executar a ação.",
      ...DEMO,
    },
    actionLabel: { control: "text", description: "Rótulo do botão que confirma.", ...DEMO },
  },
  // Conteúdo dos rótulos: docs/shared/content/alert-dialog/translations.json →
  // demonstration.labels. É o mesmo exemplo da seção Demonstração da docs page.
  args: {
    defaultOpen: false,
    onOpenChange: fn(),
    tone: "destructive",
    showMedia: false,
    triggerLabel: "Excluir conta",
    title: "Excluir conta",
    description:
      "Todos os seus dados serão removidos permanentemente. Esta ação não pode ser desfeita.",
    cancelLabel: "Cancelar",
    actionLabel: "Excluir",
  },
} satisfies Meta<PlaygroundArgs>;

export default meta;
type Story = StoryObj<PlaygroundArgs>;

// Mesmos rótulos da seção Demonstração / variante destructive da docs page.
export const Playground: Story = {
  parameters: {
    // Contrato de teste (docs/shared/content/alert-dialog/translations.json →
    // testes.*). Só entra aqui o que os steps abaixo realmente asseveram.
    covers: [
      "functional.item1",
      "functional.item4",
      "functional.item5",
      "functional.item6",
      "accessibility.item1",
      "accessibility.item2",
      "accessibility.item3",
      "accessibility.item4",
      "accessibility.item5",
      "visual.item1",
    ],
  },
  render: ({
    tone,
    showMedia,
    triggerLabel,
    title,
    description,
    cancelLabel,
    actionLabel,
    ...args
  }) => (
    // defaultOpen só é lido na montagem: sem a key, trocar o control não teria
    // efeito nenhum na tela.
    <AlertDialog key={String(args.defaultOpen)} {...args}>
      <AlertDialogTrigger render={<Button variant={tone} />}>{triggerLabel}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          {showMedia ? (
            <AlertDialogMedia>
              <TriangleAlert aria-hidden="true" />
            </AlertDialogMedia>
          ) : null}
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction variant={tone}>{actionLabel}</AlertDialogAction>
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
      // O backdrop faz parte do contrato de abertura (functional.item1): sem ele
      // o fundo continua clicável e a modalidade é só visual.
      await expect(
        document.querySelector('[data-slot="alert-dialog-overlay"]'),
      ).not.toBeNull();
      await waitFor(() => expect(openedWith(true)).toBe(true));
    });

    await step("Bloco de mídia segue o control showMedia", async () => {
      const dialog = await waitForPortal("alertdialog");
      const media = dialog.querySelector('[data-slot="alert-dialog-media"]');
      if (!args.showMedia) {
        await expect(media).toBeNull();
        return;
      }
      // A mídia é o PRIMEIRO filho do header: é dessa ordem que dependem o
      // :has() do CSS e a ordem de leitura ícone → título → descrição.
      const header = dialog.querySelector('[data-slot="alert-dialog-header"]');
      await expect(header!.firstElementChild).toBe(media);
      await expect(media!.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
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
      // A ordem começa em quem já tem o foco: dependendo da lib o foco inicial
      // cai no popup (e o primeiro Tab escolhe o controle) ou direto no Cancel.
      // Os dois caminhos satisfazem functional.item1; o que não pode é o
      // primeiro controle alcançado ser a ação destrutiva.
      const ordem: Element[] = [document.activeElement!];

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
        ordem.push(document.activeElement!);
      }
      await expect(focused.has(cancel)).toBe(true);
      await expect(focused.has(action)).toBe(true);

      // functional.item1: o primeiro controle alcançado é o Cancel — a saída
      // segura precede a destrutiva na ordem de tabulação.
      const primeiroControle = ordem.find((el) => el === cancel || el === action);
      await expect(primeiroControle).toBe(cancel);

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
