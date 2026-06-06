import type { Meta, StoryObj } from "@storybook/react";
import { within, expect, waitFor } from "storybook/test";
import { waitForPortal, waitForPortalGone } from "@/lib/wait-for-portal";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
} from "./menubar";

const meta = {
  title: "UI/Menubar/Variantes",
  tags: ["navigation"],
  component: Menubar,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    docs: {
      description: {
        component:
          "Variantes do MenubarItem: Default (neutro com hover bg-accent) e Destructive (text-destructive + bg-destructive/10 para ações irreversíveis).",
      },
    },
  },
} satisfies Meta<typeof Menubar>;

export default meta;
type Story = StoryObj<typeof meta>;

const wrapperStyle: React.CSSProperties = {
  contain: "layout",
  minHeight: 280,
  position: "relative",
};

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Item default — variante neutra com bg-accent no hover/foco. Padrão para a maioria das ações regulares.",
      },
    },
  },
  render: () => (
    <div style={wrapperStyle}>
      <Menubar>
        <MenubarMenu defaultOpen>
          <MenubarTrigger>Ações</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>Editar</MenubarItem>
            <MenubarItem>Duplicar</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    </div>
  ),
  play: async ({ step }) => {
    const body = within(document.body);
    await step("Items renderizam com data-variant=default", async () => {
      await waitForPortal("menu");
      const items = document.querySelectorAll(
        "[data-slot='menubar-item']"
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
          "Item destructive — variant=\"destructive\". Texto text-destructive + bg-destructive/10 no hover; reservado para ações irreversíveis (Excluir, Limpar).",
      },
    },
  },
  render: () => (
    <div style={wrapperStyle}>
      <Menubar>
        <MenubarMenu defaultOpen>
          <MenubarTrigger>Ações</MenubarTrigger>
          <MenubarContent>
            <MenubarItem variant="destructive">Excluir arquivo</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    </div>
  ),
  play: async ({ step }) => {
    const body = within(document.body);
    await step("Item renderiza com data-variant=destructive", async () => {
      await waitForPortal("menu");
      const item = document.querySelector(
        "[data-slot='menubar-item']"
      ) as HTMLElement | null;
      await expect(item).not.toBeNull();
      await expect(item).toHaveAttribute("data-variant", "destructive");
    });
  },
};
