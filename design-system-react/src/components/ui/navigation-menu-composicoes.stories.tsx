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
  title: "UI/NavigationMenu/Composicoes",
  tags: ["navigation"],
  component: NavigationMenu,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    docs: {
      description: {
        component:
          "Composicoes típicas: LinkSimples (sem dropdown), ComDropdown (lista vertical), MegaMenuGrid (grid 2x2 com cards) e ComCardDestacado (mega-menu + card visual lateral).",
      },
    },
  },
} satisfies Meta<typeof NavigationMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

const wrapperStyle: React.CSSProperties = {
  contain: "layout",
  minHeight: 360,
  position: "relative",
};

export const LinkSimples: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Apenas NavigationMenuLinks sem dropdown — ideal para 3 a 5 categorias planas (Início, Sobre, Contato).",
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
          <NavigationMenuItem>
            <NavigationMenuLink href="#">Sobre</NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink href="#">Preços</NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink href="#">Contato</NavigationMenuLink>
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
    await step("4 links sem botões de dropdown", async () => {
      const links = canvas.getAllByRole("link");
      await expect(links.length).toBe(4);
    });
  },
};

export const ComDropdown: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Trigger \"Produtos\" com Content de lista vertical de Links — padrão comum para 3-8 sub-páginas relacionadas.",
      },
    },
  },
  render: () => (
    <div style={wrapperStyle}>
      <NavigationMenu
        aria-label="Navegação principal"
        defaultValue="produtos"
        delayDuration={50}
      >
        <NavigationMenuList>
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
                <li>
                  <NavigationMenuLink href="#">Comparar planos</NavigationMenuLink>
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
  play: async ({ step }) => {
    const body = within(document.body);
    await step("Content visível com sub-links", async () => {
      await waitFor(async () => {
        const link = body.queryByText(/Plano Pro/i);
        await expect(link).toBeTruthy();
      });
    });
  },
};

export const MegaMenuGrid: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Trigger com Content em grid 2x2 com cards (título + descrição curta) — útil para apresentar produtos/soluções com contexto.",
      },
    },
  },
  render: () => (
    <div style={{ ...wrapperStyle, minHeight: 420 }}>
      <NavigationMenu
        aria-label="Navegação principal"
        defaultValue="solucoes"
        delayDuration={50}
      >
        <NavigationMenuList>
          <NavigationMenuItem value="solucoes">
            <NavigationMenuTrigger>Soluções</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid w-[460px] grid-cols-2 gap-2 p-3">
                <li>
                  <NavigationMenuLink href="#">
                    <div>
                      <div className="text-sm font-medium">Para Times</div>
                      <p className="text-xs text-muted-foreground">
                        Colaboração em tempo real e permissões.
                      </p>
                    </div>
                  </NavigationMenuLink>
                </li>
                <li>
                  <NavigationMenuLink href="#">
                    <div>
                      <div className="text-sm font-medium">Para Devs</div>
                      <p className="text-xs text-muted-foreground">
                        SDK, API e webhooks.
                      </p>
                    </div>
                  </NavigationMenuLink>
                </li>
                <li>
                  <NavigationMenuLink href="#">
                    <div>
                      <div className="text-sm font-medium">Para Design</div>
                      <p className="text-xs text-muted-foreground">
                        Tokens, componentes e Figma.
                      </p>
                    </div>
                  </NavigationMenuLink>
                </li>
                <li>
                  <NavigationMenuLink href="#">
                    <div>
                      <div className="text-sm font-medium">Para Marketing</div>
                      <p className="text-xs text-muted-foreground">
                        Landing pages e templates.
                      </p>
                    </div>
                  </NavigationMenuLink>
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
    await step("Mega-menu grid com 4 cards visíveis", async () => {
      await waitFor(async () => {
        const t = body.queryByText(/Para Times/i);
        const d = body.queryByText(/Para Devs/i);
        const ds = body.queryByText(/Para Design/i);
        const m = body.queryByText(/Para Marketing/i);
        await expect(Boolean(t && d && ds && m)).toBe(true);
      });
    });
  },
};

export const ComCardDestacado: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Mega-menu com lista de Links + card visual destacado lateral (anúncio, novidade, CTA). Layout 1fr + 180px.",
      },
    },
  },
  render: () => (
    <div style={{ ...wrapperStyle, minHeight: 420 }}>
      <NavigationMenu
        aria-label="Navegação principal"
        defaultValue="recursos"
        delayDuration={50}
      >
        <NavigationMenuList>
          <NavigationMenuItem value="recursos">
            <NavigationMenuTrigger>Recursos</NavigationMenuTrigger>
            <NavigationMenuContent>
              <div className="grid w-[480px] grid-cols-[1fr_180px] gap-3 p-3">
                <ul className="grid gap-1">
                  <li>
                    <NavigationMenuLink href="#">Documentação</NavigationMenuLink>
                  </li>
                  <li>
                    <NavigationMenuLink href="#">Blog</NavigationMenuLink>
                  </li>
                  <li>
                    <NavigationMenuLink href="#">Comunidade</NavigationMenuLink>
                  </li>
                  <li>
                    <NavigationMenuLink href="#">Changelog</NavigationMenuLink>
                  </li>
                </ul>
                <a
                  href="#"
                  className="flex flex-col justify-end rounded-md bg-gradient-to-b from-muted to-accent p-3 text-xs no-underline outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <div className="text-sm font-medium mb-1">Tokens v2</div>
                  <p className="text-muted-foreground">
                    Conheça a nova arquitetura de tokens.
                  </p>
                </a>
              </div>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  ),
  play: async ({ step }) => {
    const body = within(document.body);
    await step("Card destacado e lista de links presentes", async () => {
      await waitFor(async () => {
        const tokens = body.queryByText(/Tokens v2/i);
        const docs = body.queryByText(/Documentação/i);
        await expect(Boolean(tokens && docs)).toBe(true);
      });
    });
  },
};
