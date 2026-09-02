import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, within, expect, fn, waitFor } from "storybook/test";
import { waitForPortal, waitForPortalGone } from "@/lib/wait-for-portal";
import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "./drawer";
import { drawerSource } from "./drawer.source";
import { Button } from "./button";
import { DrawerDocs } from "@/components/docs/DrawerDocs";
import { withAutoDocsTab } from "@/lib/withAutoDocsTab";

const LABEL = {
  trigger: "Abrir Drawer",
  title: "Editar perfil",
  descricao: "Atualize seus dados pessoais e foto.",
  confirmar: "Confirmar",
  cancelar: "Cancelar",
};

const meta = {
  title: "Primitives/Overlay/Drawer",
  component: Drawer,
  tags: ["autodocs", "overlay"],
  parameters: {
    layout: "centered",
    docs: {
      page: withAutoDocsTab(DrawerDocs),
      // O painel imprimia o `<div style={{ contain, minHeight }}>` do canvas e
      // o `{...args}` — andaime da story, não o componente.
      source: { transform: drawerSource },
    },
  },
  argTypes: {
    direction: {
      control: { type: "radio" },
      options: ["bottom", "top", "left", "right"],
      description: "Direção de entrada do painel.",
      table: { type: { summary: "'bottom' | 'top' | 'left' | 'right'" }, defaultValue: { summary: "'bottom'" } },
    },
    defaultOpen: {
      control: "boolean",
      description: "Estado inicial em modo não-controlado.",
      table: { type: { summary: "boolean" }, defaultValue: { summary: "false" } },
    },
    dismissible: {
      control: "boolean",
      description: "Permite fechar via ESC, swipe ou clique no overlay.",
      table: { type: { summary: "boolean" }, defaultValue: { summary: "true" } },
    },
    modal: {
      control: "boolean",
      description: "Bloqueia interação com o resto da página quando aberto.",
      table: { type: { summary: "boolean" }, defaultValue: { summary: "true" } },
    },
    // `control: false` de propósito: é espião de callback, não parâmetro. Sem a
    // entrada aqui ele ficaria fora da aba API Reference (rule
    // `arg_without_argtype`) e a aba Actions nasceria vazia.
    onOpenChange: {
      control: false,
      description: "Chamado a cada abertura e fechamento, com o novo estado.",
      table: { type: { summary: "(open: boolean) => void" } },
    },
  },
  args: {
    direction: "bottom",
    defaultOpen: false,
    dismissible: true,
    modal: true,
    onOpenChange: fn(),
  },
} satisfies Meta<typeof Drawer>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Par idempotente de abertura e fechamento.
 *
 * O painel Interactions REEXECUTA a play no mesmo DOM — não remonta. Um clique
 * cego partiria do estado que a rodada anterior deixou e inverteria todo o
 * resto. Cada passo estabelece a própria precondição.
 */
async function open(trigger: HTMLElement): Promise<HTMLElement> {
  if (within(document.body).queryAllByRole("dialog").length === 0) {
    await userEvent.click(trigger);
  }
  return await waitForPortal("dialog");
}

async function close(): Promise<void> {
  if (within(document.body).queryAllByRole("dialog").length > 0) {
    await userEvent.keyboard("{Escape}");
  }
  await waitForPortalGone("dialog");
}

export const Playground: Story = {
  parameters: {
    covers: [
      "functional.item1", "functional.item2", "functional.item3", "functional.item4",
      "accessibility.item3", "accessibility.item4", "accessibility.item5",
    ],
  },
  render: (args) => (
    <div style={{ contain: "layout", position: "relative" }}>
      <Drawer {...args}>
        <DrawerTrigger asChild>
          <Button variant="outline">{LABEL.trigger}</Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{LABEL.title}</DrawerTitle>
            <DrawerDescription>{LABEL.descricao}</DrawerDescription>
          </DrawerHeader>
          <DrawerBody className="nds-text-body nds-text-muted-foreground">
            Conteúdo do drawer.
          </DrawerBody>
          <DrawerFooter>
            <Button>{LABEL.confirmar}</Button>
            <DrawerClose asChild>
              <Button variant="outline">{LABEL.cancelar}</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  ),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: LABEL.trigger });

    await close();

    await step("1. Clicar no gatilho abre o painel, com nome e descrição acessíveis", async () => {
      const callsBefore = (args.onOpenChange as ReturnType<typeof fn>).mock.calls.length;
      const panel = await open(trigger);

      await expect(panel).toBeVisible();
      await expect(panel).toHaveAttribute("role", "dialog");
      await expect(panel).toHaveAttribute("aria-modal", "true");
      // Nome e descrição saem do aria-labelledby/-describedby que o primitivo
      // liga aos ids REAIS do título e da descrição — painel modal anônimo é o
      // defeito silencioso aqui.
      await expect(panel).toHaveAccessibleName(LABEL.title);
      await expect(panel).toHaveAccessibleDescription(LABEL.descricao);
      await expect(panel).toHaveAttribute("data-vaul-drawer-direction", args.direction!);
      await expect(panel).toHaveClass(/nds-drawer-content/);
      await expect(
        (args.onOpenChange as ReturnType<typeof fn>).mock.calls.length,
      ).toBe(callsBefore + 1);
    });

    await step("2. O painel é portalizado para fora da story", async () => {
      const panel = await waitForPortal("dialog");
      await expect(canvasElement.contains(panel)).toBe(false);
      await expect(document.body.contains(panel)).toBe(true);
    });

    await step("3. O foco entra no painel e Tab não escapa dele", async () => {
      const panel = await waitForPortal("dialog");
      await waitFor(() => {
        if (!panel.contains(document.activeElement)) {
          throw new Error("o foco não entrou no painel");
        }
      });
      // Volta suficiente para dar a volta completa em qualquer direção.
      for (let i = 0; i < 6; i++) await userEvent.tab();
      await expect(panel.contains(document.activeElement)).toBe(true);
    });

    await step("4. Escape fecha e devolve o foco ao gatilho", async () => {
      await close();
      await waitFor(() => {
        if (document.activeElement !== trigger) {
          throw new Error("o foco não voltou ao gatilho");
        }
      });
      await expect(within(document.body).queryAllByRole("dialog")).toHaveLength(0);
    });

    await step("5. O botão de fechar do rodapé fecha e devolve o foco ao gatilho", async () => {
      const panel = await open(trigger);
      const closeBtn = within(panel).getByRole("button", { name: LABEL.cancelar });
      await userEvent.click(closeBtn);
      await waitForPortalGone("dialog");
      await waitFor(() => {
        if (document.activeElement !== trigger) {
          throw new Error("o foco não voltou ao gatilho");
        }
      });
      await expect(within(document.body).queryAllByRole("dialog")).toHaveLength(0);
    });

    // Termina fechado: a próxima rodada da play precisa do mesmo ponto de
    // partida desta, e é este estado que o Chromatic fotografa.
    await close();
  },
};
