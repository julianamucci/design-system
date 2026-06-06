import type { Meta, StoryObj } from "@storybook/react";
import { within, expect } from "storybook/test";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "./navigation-menu";

const meta = {
  title: "UI/NavigationMenu/Variantes",
  tags: ["navigation"],
  component: NavigationMenu,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    docs: {
      description: {
        component:
          "Variantes de orientation do NavigationMenu: Horizontal (header de site, padrão) e Vertical (sidebars/mobile drawers).",
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

export const Horizontal: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Padrão — orientation=horizontal. Lista de items dispostos lado a lado; usado em headers de site/produto web.",
      },
    },
  },
  render: () => (
    <div style={wrapperStyle}>
      <NavigationMenu aria-label="Navegação principal" orientation="horizontal">
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
          <NavigationMenuItem>
            <NavigationMenuLink href="#">Sobre</NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step("Root tem role=navigation com aria-label", async () => {
      const nav = canvas.getByRole("navigation");
      await expect(nav).toHaveAttribute("aria-label", "Navegação principal");
    });
  },
};

export const Vertical: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "orientation=vertical — items empilhados verticalmente; usado em sidebars ou mobile drawers. Setas Cima/Baixo navegam entre Triggers.",
      },
    },
  },
  render: () => (
    <div style={{ ...wrapperStyle, minWidth: 220 }}>
      <NavigationMenu aria-label="Navegação principal" orientation="vertical">
        <NavigationMenuList className="flex-col items-stretch gap-1">
          <NavigationMenuItem>
            <NavigationMenuLink href="#">Início</NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink href="#">Produtos</NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink href="#">Soluções</NavigationMenuLink>
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
    await step("Root tem role=navigation e aria-label", async () => {
      const nav = canvas.getByRole("navigation");
      await expect(nav).toHaveAttribute("aria-label", "Navegação principal");
    });
  },
};
