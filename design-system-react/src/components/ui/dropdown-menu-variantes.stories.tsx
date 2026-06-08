import type { Meta, StoryObj } from "@storybook/react";
import { within, expect, waitFor } from "storybook/test";
import { waitForPortal, waitForPortalGone } from "@/lib/wait-for-portal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { Button } from "./button";

const meta = {
  title: "UI/DropdownMenu/Variantes",
  tags: ["overlay"],
  component: DropdownMenu,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    docs: {
      description: {
        component:
          "Variantes do DropdownMenuItem: Default (neutro com hover bg-accent) e Destructive (text-destructive + bg-destructive/10 para ações irreversíveis).",
      },
    },
  },
} satisfies Meta<typeof DropdownMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

const wrapperStyle: React.CSSProperties = {
  contain: "layout",
  minHeight: 300,
  position: "relative",
};

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Item default — variante neutra. Usa bg-accent no hover/foco; ideal para ações regulares (Perfil, Configuracoes, Editar).",
      },
    },
  },
  render: () => (
    <div style={wrapperStyle}>
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">Abrir</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Perfil</DropdownMenuItem>
          <DropdownMenuItem>Configuracoes</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  ),
  play: async ({ step }) => {
    const body = within(document.body);
    await step("Items renderizam com data-variant=default", async () => {
      await waitForPortal("menu");
      const items = document.querySelectorAll(
        "[data-slot='dropdown-menu-item']"
      );
      await expect(items.length).toBe(2);
      items.forEach((item) => {
        expect(item.getAttribute("data-variant")).toBe("default");
      });
    });
  },
};

export const Destructive: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Item destructive — variant=\"destructive\". Texto text-destructive e fundo bg-destructive/10 no hover; reservado para ações irreversíveis (Excluir, Sair).",
      },
    },
  },
  render: () => (
    <div style={wrapperStyle}>
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">Abrir</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem variant="destructive">Excluir conta</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  ),
  play: async ({ step }) => {
    const body = within(document.body);
    await step("Item renderiza com data-variant=destructive", async () => {
      await waitForPortal("menu");
      const item = document.querySelector(
        "[data-slot='dropdown-menu-item']"
      ) as HTMLElement | null;
      await expect(item).not.toBeNull();
      await expect(item).toHaveAttribute("data-variant", "destructive");
    });
  },
};
