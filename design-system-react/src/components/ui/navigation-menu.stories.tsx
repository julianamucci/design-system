import type { Meta, StoryObj } from "@storybook/react";
import { userEvent, within, expect, waitFor } from "storybook/test";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "./navigation-menu";
import { NavigationMenuDocs } from "@/components/docs/NavigationMenuDocs";
import { withAutoDocsTab } from "@/lib/withAutoDocsTab";

type PlaygroundArgs = {
  defaultValue?: string;
  delayDuration?: number;
  orientation?: "horizontal" | "vertical";
};

const meta = {
  title: "UI/NavigationMenu",
  component: NavigationMenu,
  tags: ["autodocs", "navigation"],
  parameters: {
    layout: "centered",
    docs: { page: withAutoDocsTab(NavigationMenuDocs) },
  },
  argTypes: {
    defaultValue: {
      control: "text",
      description:
        "Item inicialmente aberto (ex: 'produtos' | 'solucoes'). Mapeado para defaultValue do Root.",
    },
    delayDuration: {
      control: "number",
      description:
        "Delay (ms) antes de abrir Content em hover. Default 200; em testes use 50–100.",
    },
    orientation: {
      control: "radio",
      options: ["horizontal", "vertical"],
      description: "Orientação da lista de items.",
    },
  },
  args: {
    defaultValue: "",
    delayDuration: 200,
    orientation: "horizontal",
  },
} satisfies Meta<PlaygroundArgs>;

export default meta;
type Story = StoryObj<PlaygroundArgs>;

export const Playground: Story = {
  render: (args) => {
    const { defaultValue, delayDuration, orientation } = args;
    return (
      <div
        style={{ contain: "layout", minHeight: 320, position: "relative" }}
      >
        <NavigationMenu
          aria-label="Navegação principal"
          defaultValue={defaultValue || undefined}
          delayDuration={delayDuration}
          orientation={orientation}
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
            <NavigationMenuItem value="solucoes">
              <NavigationMenuTrigger>Soluções</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[260px] gap-1 p-2">
                  <li>
                    <NavigationMenuLink href="#">Para Times</NavigationMenuLink>
                  </li>
                  <li>
                    <NavigationMenuLink href="#">Para Devs</NavigationMenuLink>
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
    );
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);

    await step("Root tem role=navigation e aria-label", async () => {
      const nav = canvas.getByRole("navigation");
      await expect(nav).toBeVisible();
      await expect(nav).toHaveAttribute("aria-label", "Navegação principal");
    });

    await step("Hover/Enter no Trigger Produtos abre Content", async () => {
      const trigger = canvas.getByRole("button", { name: /Produtos/i });
      await userEvent.click(trigger);
      await waitFor(async () => {
        const content = body.queryByText(/Plano Starter/i);
        await expect(content).toBeTruthy();
      });
    });
  },
};
