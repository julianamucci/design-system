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
import { Button } from "./button";
import { DrawerDocs } from "@/components/docs/DrawerDocs";
import { withAutoDocsTab } from "@/lib/withAutoDocsTab";

const ROTULO = {
  gatilho: "Abrir Drawer",
  titulo: "Editar perfil",
  descricao: "Atualize seus dados pessoais e foto.",
  confirmar: "Confirmar",
  cancelar: "Cancelar",
};

const meta = {
  title: "UI/Drawer",
  component: Drawer,
  tags: ["autodocs", "disclosure"],
  parameters: {
    layout: "centered",
    docs: { page: withAutoDocsTab(DrawerDocs) },
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
async function abrir(trigger: HTMLElement): Promise<HTMLElement> {
  if (within(document.body).queryAllByRole("dialog").length === 0) {
    await userEvent.click(trigger);
  }
  return await waitForPortal("dialog");
}

async function fechar(): Promise<void> {
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
    <div style={{ contain: "layout", minHeight: 400, position: "relative" }}>
      <Drawer {...args}>
        <DrawerTrigger asChild>
          <Button variant="outline">{ROTULO.gatilho}</Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{ROTULO.titulo}</DrawerTitle>
            <DrawerDescription>{ROTULO.descricao}</DrawerDescription>
          </DrawerHeader>
          <DrawerBody className="nds-text-body nds-text-muted-foreground">
            Conteúdo do drawer.
          </DrawerBody>
          <DrawerFooter>
            <Button>{ROTULO.confirmar}</Button>
            <DrawerClose asChild>
              <Button variant="outline">{ROTULO.cancelar}</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  ),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: ROTULO.gatilho });

    await fechar();

    await step("1. Clicar no gatilho abre o painel, com nome e descrição acessíveis", async () => {
      const chamadasAntes = (args.onOpenChange as ReturnType<typeof fn>).mock.calls.length;
      const painel = await abrir(trigger);

      await expect(painel).toBeVisible();
      await expect(painel).toHaveAttribute("role", "dialog");
      await expect(painel).toHaveAttribute("aria-modal", "true");
      // Nome e descrição saem do aria-labelledby/-describedby que o primitivo
      // liga aos ids REAIS do título e da descrição — painel modal anônimo é o
      // defeito silencioso aqui.
      await expect(painel).toHaveAccessibleName(ROTULO.titulo);
      await expect(painel).toHaveAccessibleDescription(ROTULO.descricao);
      await expect(painel).toHaveAttribute("data-vaul-drawer-direction", args.direction!);
      await expect(painel).toHaveClass(/nds-drawer-content/);
      await expect(
        (args.onOpenChange as ReturnType<typeof fn>).mock.calls.length,
      ).toBe(chamadasAntes + 1);
    });

    await step("2. O painel é portalizado para fora da story", async () => {
      const painel = await waitForPortal("dialog");
      await expect(canvasElement.contains(painel)).toBe(false);
      await expect(document.body.contains(painel)).toBe(true);
    });

    await step("3. O foco entra no painel e Tab não escapa dele", async () => {
      const painel = await waitForPortal("dialog");
      await waitFor(() => {
        if (!painel.contains(document.activeElement)) {
          throw new Error("o foco não entrou no painel");
        }
      });
      // Volta suficiente para dar a volta completa em qualquer direção.
      for (let i = 0; i < 6; i++) await userEvent.tab();
      await expect(painel.contains(document.activeElement)).toBe(true);
    });

    await step("4. Escape fecha e devolve o foco ao gatilho", async () => {
      await fechar();
      await waitFor(() => {
        if (document.activeElement !== trigger) {
          throw new Error("o foco não voltou ao gatilho");
        }
      });
      await expect(within(document.body).queryAllByRole("dialog")).toHaveLength(0);
    });

    await step("5. O botão de fechar do rodapé fecha e devolve o foco ao gatilho", async () => {
      const painel = await abrir(trigger);
      const fecharBtn = within(painel).getByRole("button", { name: ROTULO.cancelar });
      await userEvent.click(fecharBtn);
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
    await fechar();
  },
};
