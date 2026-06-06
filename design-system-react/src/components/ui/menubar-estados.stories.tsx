import type { Meta, StoryObj } from "@storybook/react";
import { within, expect, waitFor } from "storybook/test";
import { waitForPortal, waitForPortalGone } from "@/lib/wait-for-portal";
import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
} from "./menubar";

const meta = {
  title: "UI/Menubar/Estados",
  tags: ["navigation"],
  component: Menubar,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    docs: {
      description: {
        component:
          "Estados canônicos do Menubar: Fechado (apenas barra), Aberto (defaultOpen no menu), ItemDesabilitado e CheckboxChecked.",
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

export const Fechado: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Estado padrão — apenas a barra com Triggers visíveis; nenhum role=menu no DOM.",
      },
    },
  },
  render: () => (
    <div style={wrapperStyle}>
      <Menubar>
        <MenubarMenu>
          <MenubarTrigger>Arquivo</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>Novo</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger>Editar</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>Desfazer</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    await step("Triggers visíveis e nenhum menu aberto", async () => {
      const triggers = canvas.getAllByRole("menuitem");
      await expect(triggers.length).toBeGreaterThanOrEqual(2);
      const menu = body.queryByRole("menu");
      await expect(menu).toBeNull();
    });
  },
};

export const Aberto: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Menu Arquivo aberto via defaultOpen — popup com role=menu, Items com role=menuitem.",
      },
    },
  },
  render: () => (
    <div style={wrapperStyle}>
      <Menubar>
        <MenubarMenu defaultOpen>
          <MenubarTrigger>Arquivo</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>Novo</MenubarItem>
            <MenubarItem>Abrir</MenubarItem>
            <MenubarItem>Salvar</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger>Editar</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>Desfazer</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    </div>
  ),
  play: async ({ step }) => {
    const body = within(document.body);
    await step("Menu aberto com role=menu", async () => {
      const menu = await waitForPortal("menu");
      await expect(menu).toBeVisible();
    });
  },
};

export const ItemDesabilitado: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Item com prop disabled — bloqueia interação, recebe data-disabled e aria-disabled=true.",
      },
    },
  },
  render: () => (
    <div style={wrapperStyle}>
      <Menubar>
        <MenubarMenu defaultOpen>
          <MenubarTrigger>Arquivo</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>Novo</MenubarItem>
            <MenubarItem disabled>Salvar (em breve)</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    </div>
  ),
  play: async ({ step }) => {
    const body = within(document.body);
    await step("Pelo menos um item com data-disabled", async () => {
      await waitForPortal("menu");
      const items = document.querySelectorAll("[data-slot='menubar-item']");
      const disabled = Array.from(items).find(
        (el) =>
          el.hasAttribute("data-disabled") ||
          el.getAttribute("aria-disabled") === "true"
      );
      await expect(disabled).toBeTruthy();
    });
  },
};

export const CheckboxChecked: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "CheckboxItem com checked=true — role=menuitemcheckbox e aria-checked=true; ícone Check exibido no slot esquerdo.",
      },
    },
  },
  render: () => (
    <div style={wrapperStyle}>
      <Menubar>
        <MenubarMenu defaultOpen>
          <MenubarTrigger>Exibir</MenubarTrigger>
          <MenubarContent>
            <MenubarCheckboxItem checked>Sidebar</MenubarCheckboxItem>
            <MenubarCheckboxItem checked={false}>Toolbar</MenubarCheckboxItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    </div>
  ),
  play: async ({ step }) => {
    const body = within(document.body);
    await step("CheckboxItem com aria-checked=true", async () => {
      await waitForPortal("menu");
      const checkboxes = body.getAllByRole("menuitemcheckbox");
      await expect(checkboxes.length).toBe(2);
      const checked = checkboxes.find(
        (el) => el.getAttribute("aria-checked") === "true"
      );
      await expect(checked).toBeTruthy();
    });
  },
};
