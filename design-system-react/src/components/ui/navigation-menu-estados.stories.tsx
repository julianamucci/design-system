import type { Meta, StoryObj } from "@storybook/react";
import { within, expect, waitFor } from "storybook/test";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "./navigation-menu";

const meta = {
  title: "UI/NavigationMenu/Estados",
  tags: ["navigation"],
  component: NavigationMenu,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    docs: {
      description: {
        component:
          "Estados canônicos do NavigationMenu: Fechado (apenas Triggers visíveis), Aberto (Content expandido no Viewport) e Ativo (Link com aria-current=\"page\").",
      },
    },
  },
} satisfies Meta<typeof NavigationMenu>;

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
          "Estado padrão — sem defaultValue. Apenas Triggers e Links visíveis na barra; nenhum Content aberto.",
      },
    },
  },
  render: () => (
    <div style={wrapperStyle}>
      <NavigationMenu aria-label="Navegação principal">
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuLink href="#">Início</NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem value="produtos">
            <NavigationMenuTrigger>Produtos</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid w-[220px] gap-1 p-2">
                <li>
                  <NavigationMenuLink href="#">Plano Pro</NavigationMenuLink>
                </li>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step("Root tem role=navigation", async () => {
      const nav = canvas.getByRole("navigation");
      await expect(nav).toHaveAttribute("aria-label", "Navegação principal");
    });
    await step("Trigger não está expandido", async () => {
      const trigger = canvas.getByRole("button", { name: /Produtos/i });
      await expect(trigger.getAttribute("aria-expanded")).not.toBe("true");
    });
  },
};

export const Aberto: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "defaultValue=\"produtos\" + delayDuration baixo — Content expandido no Viewport com data-state=\"open\".",
      },
    },
  },
  render: () => (
    <div style={{ ...wrapperStyle, minHeight: 360 }}>
      <NavigationMenu
        aria-label="Navegação principal"
        defaultValue="produtos"
        delayDuration={50}
      >
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuLink href="#">Início</NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem value="produtos">
            <NavigationMenuTrigger>Produtos</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid w-[260px] gap-1 p-2">
                <li>
                  <NavigationMenuLink href="#">Plano Starter</NavigationMenuLink>
                </li>
                <li>
                  <NavigationMenuLink href="#">Plano Pro</NavigationMenuLink>
                </li>
                <li>
                  <NavigationMenuLink href="#">Plano Empresarial</NavigationMenuLink>
                </li>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  ),
  play: async ({ step }) => {
    const body = within(document.body);
    await step("Content visível com sub-link Plano Pro", async () => {
      await waitFor(async () => {
        const link = body.queryByText(/Plano Pro/i);
        await expect(link).toBeTruthy();
      });
    });
  },
};

export const Ativo: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Link \"Início\" com aria-current=\"page\" — leitor de tela anuncia 'página atual'; estilo destacado via aria-[current=page]:bg-accent.",
      },
    },
  },
  render: () => (
    <div style={wrapperStyle}>
      <NavigationMenu aria-label="Navegação principal">
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuLink
              href="#"
              aria-current="page"
              className="aria-[current=page]:bg-accent aria-[current=page]:font-semibold"
            >
              Início
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink href="#">Produtos</NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink href="#">Sobre</NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step("Root tem role=navigation", async () => {
      const nav = canvas.getByRole("navigation");
      await expect(nav).toHaveAttribute("aria-label", "Navegação principal");
    });
    await step("Link Início tem aria-current=page", async () => {
      const link = canvas.getByRole("link", { name: /Início/i });
      await expect(link).toHaveAttribute("aria-current", "page");
    });
  },
};
