import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { userEvent, within, expect, waitFor } from "storybook/test";
import { waitForPortal, waitForPortalGone } from "@/lib/wait-for-portal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { Button } from "./button";

const meta = {
  title: "UI/DropdownMenu/Estados",
  tags: ["overlay"],
  component: DropdownMenu,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    docs: {
      description: {
        component:
          "Estados canônicos do DropdownMenu: Fechado (apenas trigger), Aberto (defaultOpen), Controlado (open + onOpenChange) e ItemDesabilitado.",
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

export const Fechado: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Estado padrão — apenas o trigger renderizado. Portal vazio: nenhum role=menu no DOM.",
      },
    },
  },
  render: () => (
    <div style={wrapperStyle}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">Abrir menu</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Perfil</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    await step("Apenas trigger visível, menu ausente", async () => {
      const trigger = canvas.getByRole("button", { name: /Abrir menu/i });
      await expect(trigger).toBeVisible();
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
          "Menu aberto via defaultOpen — popup com role=menu, foco no primeiro item, navegação por setas e ESC para fechar.",
      },
    },
  },
  render: () => (
    <div style={wrapperStyle}>
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">Abrir menu</Button>
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
    await step("Menu aberto com role=menu", async () => {
      const menu = await waitForPortal("menu");
      await expect(menu).toBeVisible();
      const items = body.getAllByRole("menuitem");
      await expect(items.length).toBeGreaterThanOrEqual(2);
    });
  },
};

export const Controlado: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Estado controlado via open + onOpenChange. Botões externos abrem e fecham o menu programaticamente.",
      },
    },
  },
  render: () => {
    const ControlledDemo = () => {
      const [open, setOpen] = useState(false);
      return (
        <div className="flex flex-col gap-3" style={wrapperStyle}>
          <div className="flex gap-2">
            <Button onClick={() => setOpen(true)}>Abrir externamente</Button>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Fechar externamente
            </Button>
          </div>
          <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Trigger</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setOpen(false)}>
                Perfil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setOpen(false)}>
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    };
    return <ControlledDemo />;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);

    await step("Botão externo abre o menu", async () => {
      const openBtn = canvas.getByRole("button", { name: /Abrir externamente/i });
      await userEvent.click(openBtn);
      const menu = await waitForPortal("menu");
      await expect(menu).toBeVisible();
    });

    await step("ESC fecha o menu controlado", async () => {
      await userEvent.keyboard("{Escape}");
      await waitFor(
        () => {
          const menu = body.queryByRole("menu");
          if (menu) throw new Error("ainda aberto");
        },
        { timeout: 1000 }
      );
    });
  },
};

export const ItemDesabilitado: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Item com prop disabled — bloqueia interação, recebe aria-disabled=true e cursor not-allowed.",
      },
    },
  },
  render: () => (
    <div style={wrapperStyle}>
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">Abrir menu</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Perfil</DropdownMenuItem>
          <DropdownMenuItem disabled>Configuracoes (em breve)</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  ),
  play: async ({ step }) => {
    const body = within(document.body);
    await step("Item disabled tem data-disabled e aria-disabled", async () => {
      await waitForPortal("menu");
      const items = document.querySelectorAll(
        "[data-slot='dropdown-menu-item']"
      );
      const disabled = Array.from(items).find(
        (el) => el.hasAttribute("data-disabled") || el.getAttribute("aria-disabled") === "true"
      );
      await expect(disabled).toBeTruthy();
    });
  },
};
