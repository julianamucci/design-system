import type { Meta, StoryObj } from "@storybook/react";
import { userEvent, within, expect, fn, waitFor } from "storybook/test";
import { waitForPortal, waitForPortalGone } from "@/lib/wait-for-portal";
import {
  DropdownMenu,
  DropdownMenuContent,
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
            <DropdownMenuLabel>Conta</DropdownMenuLabel>
            <DropdownMenuItem>Perfil</DropdownMenuItem>
            <DropdownMenuItem>Configuracoes</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">Sair</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);

    await step("1. Abre ao clicar no trigger", async () => {
      const trigger = canvas.getByRole("button", { name: /Abrir menu/i });
      await userEvent.click(trigger);
      const menu = await waitForPortal("menu");
      await expect(menu).toBeVisible();
    });

    await step("2. ESC fecha o menu e retorna foco ao trigger", async () => {
      await userEvent.keyboard("{Escape}");
      await waitFor(
        () => {
          const menu = body.queryByRole("menu");
          if (menu) throw new Error("menu still open");
        },
        { timeout: 1000 }
      );
    });
  },
};
