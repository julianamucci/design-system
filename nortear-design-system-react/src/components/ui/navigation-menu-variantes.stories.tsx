import type { Meta, StoryObj } from "@storybook/react-vite";
import { within, expect, userEvent } from "storybook/test";
import {
  NavigationMenu,
  NavigationMenuChild,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "./navigation-menu";
import { abrir, fechar } from "./navigation-menu.fixtures";

const meta = {
  title: "UI/NavigationMenu/Variants",
  tags: ["navigation"],
  component: NavigationMenu,
  parameters: {
    layout: "centered",
    // Sem `argTypes` nesta meta: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          "As duas direções da barra. Horizontal é o cabeçalho de site, com os itens em linha e o painel abrindo para baixo; vertical é a coluna de uma barra lateral ou gaveta, com os itens empilhados e o painel abrindo para o lado — abrir para baixo numa coluna cobriria os próprios itens seguintes.",
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
    covers: ["visual.item1"],
    docs: {
      description: {
        story: "Padrão — itens lado a lado; usado em cabeçalhos de site e de produto web.",
      },
    },
  },
  render: () => (
    <div style={wrapperStyle}>
      <NavigationMenu aria-label="Navegação principal">
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuLink href="#inicio">Início</NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem value="produtos">
            <NavigationMenuTrigger>Produtos</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="nds-stack nds-list-none nds-w-xs" data-spacing="xs">
                <li>
                  <NavigationMenuChild href="#inicial">
                    <div className="nds-navigation-menu-child-label">Plano Inicial</div>
                  </NavigationMenuChild>
                </li>
                <li>
                  <NavigationMenuChild href="#profissional">
                    <div className="nds-navigation-menu-child-label">Plano Profissional</div>
                  </NavigationMenuChild>
                </li>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem value="recursos">
            <NavigationMenuTrigger>Recursos</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="nds-stack nds-list-none nds-w-xs" data-spacing="xs">
                <li>
                  <NavigationMenuChild href="#guias">
                    <div className="nds-navigation-menu-child-label">Guias</div>
                  </NavigationMenuChild>
                </li>
                <li>
                  <NavigationMenuChild href="#api">
                    <div className="nds-navigation-menu-child-label">Referência da API</div>
                  </NavigationMenuChild>
                </li>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink href="#precos">Preços</NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink href="#sobre">Sobre</NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Cinco itens, dois deles com painel", async () => {
      const itens = canvasElement.querySelectorAll('[data-slot="navigation-menu-item"]');
      await expect(itens).toHaveLength(5);
      await expect(canvas.getAllByRole("button")).toHaveLength(2);
      await expect(canvas.getAllByRole("link")).toHaveLength(3);
    });

    await step("Os itens ficam lado a lado, na mesma linha", async () => {
      const itens = [
        ...canvasElement.querySelectorAll<HTMLElement>('[data-slot="navigation-menu-item"]'),
      ];
      const primeiro = itens[0].getBoundingClientRect();
      const segundo = itens[1].getBoundingClientRect();
      await expect(segundo.left).toBeGreaterThan(primeiro.left);
      await expect(Math.abs(segundo.top - primeiro.top)).toBeLessThan(2);
    });

    await step("O painel abre abaixo da barra", async () => {
      const gatilho = canvas.getByRole("button", { name: /Produtos/ });
      const painel = await abrir(gatilho);
      const popup = painel.closest<HTMLElement>(".nds-navigation-menu-popup");
      // `data-side` só existe depois de o floating-ui medir — por isso o
      // `abrir` espera por ele antes de devolver.
      await expect(popup?.getAttribute("data-side")).toBe("bottom");
      await fechar(gatilho);
    });
  },
};

export const Vertical: Story = {
  parameters: {
    covers: ["visual.item5"],
    docs: {
      description: {
        story:
          "Itens empilhados; usado em barras laterais e gavetas móveis. As setas Cima/Baixo percorrem a barra.",
      },
    },
  },
  render: () => (
    <div style={{ ...wrapperStyle, minWidth: 220 }}>
      <NavigationMenu aria-label="Navegação da conta" orientation="vertical">
        <NavigationMenuList className="nds-stack nds-w-sm" data-spacing="xs">
          <NavigationMenuItem>
            <NavigationMenuLink href="#painel">Painel</NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem value="relatorios">
            <NavigationMenuTrigger>Relatórios</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="nds-stack nds-list-none nds-w-xs" data-spacing="xs">
                <li>
                  <NavigationMenuChild href="#vendas">
                    <div className="nds-navigation-menu-child-label">Vendas</div>
                  </NavigationMenuChild>
                </li>
                <li>
                  <NavigationMenuChild href="#assinaturas">
                    <div className="nds-navigation-menu-child-label">Assinaturas</div>
                  </NavigationMenuChild>
                </li>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink href="#configuracoes">Configurações</NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Os itens empilham em coluna", async () => {
      const itens = [
        ...canvasElement.querySelectorAll<HTMLElement>('[data-slot="navigation-menu-item"]'),
      ];
      await expect(itens).toHaveLength(3);
      const primeiro = itens[0].getBoundingClientRect();
      const segundo = itens[1].getBoundingClientRect();
      await expect(segundo.top).toBeGreaterThan(primeiro.top);
    });

    await step("As setas do eixo vertical percorrem a barra", async () => {
      const painel = canvas.getByRole("link", { name: "Painel" });
      const gatilho = canvas.getByRole("button", { name: /Relatórios/ });
      painel.focus();
      await userEvent.keyboard("{ArrowDown}");
      await expect(document.activeElement).toBe(gatilho);
    });
  },
};
