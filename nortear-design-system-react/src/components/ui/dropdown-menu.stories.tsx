import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, within, expect, fn, waitFor } from "storybook/test";
import { waitForPortal, waitForPortalGone } from "@/lib/wait-for-portal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { Button } from "./button";
import { DropdownMenuDocs } from "@/components/docs/DropdownMenuDocs";
import { withAutoDocsTab } from "@/lib/withAutoDocsTab";

const meta = {
  title: "UI/DropdownMenu",
  component: DropdownMenu,
  tags: ["autodocs", "overlay"],
  parameters: {
    layout: "centered",
    docs: { page: withAutoDocsTab(DropdownMenuDocs) },
  },
  argTypes: {
    side: {
      control: { type: "radio" },
      options: ["top", "bottom", "left", "right"],
      description: "Lado de abertura do Content.",
    },
    align: {
      control: { type: "radio" },
      options: ["start", "center", "end"],
      description: "Alinhamento horizontal do Content.",
    },
    modal: {
      control: "boolean",
      description: "Bloqueia interação com o resto da página quando aberto.",
    },
    defaultOpen: {
      control: "boolean",
      description: "Estado inicial em modo não-controlado.",
    },
  },
  args: {
    side: "bottom",
    align: "start",
    modal: true,
    defaultOpen: false,
  },
} as Meta<typeof DropdownMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    onOpenChange: fn(),
  },
  parameters: {
    covers: [
      "functional.item1",
      "functional.item3",
      "functional.item4",
      "accessibility.item1",
      "accessibility.item2",
      "accessibility.item3",
      "accessibility.item5",
    ],
  },
  render: (args) => {
    const { side, align, ...rootArgs } = args as typeof args & {
      side?: "top" | "bottom" | "left" | "right";
      align?: "start" | "center" | "end";
    };
    return (
      <div style={{ contain: "layout", minHeight: 300, position: "relative" }}>
        <DropdownMenu {...rootArgs}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">Abrir menu</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side={side} align={align}>
            {/*
              O rótulo tem que morar dentro do grupo que ele nomeia. Fora dele o
              primitivo lança "MenuGroupContext is missing" e o menu inteiro
              deixa de renderizar — sem erro na tela, só um portal vazio. Foi o
              que derrubava esta story e mais três.
            */}
            <DropdownMenuGroup>
              <DropdownMenuLabel>Conta</DropdownMenuLabel>
              <DropdownMenuItem>Perfil</DropdownMenuItem>
              <DropdownMenuItem>Configuracoes</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive">Sair</DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const gatilho = canvas.getByRole("button", { name: /Abrir menu/i });

    await step("O gatilho anuncia que abre um menu, e que está fechado", async () => {
      await expect(gatilho).toHaveAttribute("aria-haspopup", "menu");
      await expect(gatilho).toHaveAttribute("aria-expanded", "false");
    });

    await step("Clicar abre o menu com papel de menu e o foco entra nele", async () => {
      // Idempotente: o clique só acontece com o menu fechado, então o replay do
      // painel Interactions parte do mesmo estado da primeira rodada.
      if (gatilho.getAttribute("aria-expanded") !== "true") await userEvent.click(gatilho);

      const menu = await waitForPortal("menu");
      await expect(menu).toBeVisible();
      await expect(gatilho).toHaveAttribute("aria-expanded", "true");
      await expect(args.onOpenChange).toHaveBeenCalledWith(true, expect.anything());
      await expect(within(menu).getAllByRole("menuitem")).toHaveLength(3);
      // O foco tem que ENTRAR no menu: se ficasse no gatilho, a seta seguinte
      // não acharia item nenhum e o menu seria inoperável por teclado.
      await waitFor(async () => {
        await expect(menu.contains(document.activeElement)).toBe(true);
      });
    });

    await step("Enter escolhe o item, fecha o menu e devolve o foco ao gatilho", async () => {
      const menu = await waitForPortal("menu");
      within(menu).getAllByRole("menuitem")[0].focus();
      await userEvent.keyboard("{Enter}");
      await waitForPortalGone("menu");
      await expect(gatilho).toHaveAttribute("aria-expanded", "false");
      // O foco não pode cair no corpo do documento: quem navega por teclado
      // teria de percorrer a página inteira de novo para voltar ao ponto.
      await waitFor(async () => {
        await expect(document.activeElement).toBe(gatilho);
      });
    });

    await step("Escape fecha e devolve o foco ao gatilho", async () => {
      if (gatilho.getAttribute("aria-expanded") !== "true") await userEvent.click(gatilho);
      await waitForPortal("menu");

      await userEvent.keyboard("{Escape}");
      await waitForPortalGone("menu");
      await expect(gatilho).toHaveAttribute("aria-expanded", "false");
      await waitFor(async () => {
        await expect(document.activeElement).toBe(gatilho);
      });
    });
  },
};
