import type { Meta, StoryObj } from "@storybook/react-vite";
import { within, expect } from "storybook/test";
import {
  NavigationMenu,
  NavigationMenuChild,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "./navigation-menu";
import { esperarPainel, popupAberto } from "./navigation-menu.fixtures";
import { REGRA_GUARDA_DE_FOCO } from "@/lib/wait-for-portal";

const meta = {
  title: "UI/NavigationMenu/States",
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
          "Os três estados canônicos: Fechado (só a barra), Aberto (painel do item ativo no popup compartilhado) e Ativo (o destino da página atual).",
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

export const Closed: Story = {
  parameters: {
    covers: ["accessibility.item1"],
    docs: {
      description: {
        story: "Estado padrão — apenas gatilhos e destinos visíveis na barra; nenhum painel aberto.",
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
              </ul>
            </NavigationMenuContent>
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

    await step("Fechado, o painel não existe no DOM", async () => {
      // O portal DESMONTA ao fechar. O painel não é um bloco escondido: quem
      // navega com leitor de tela não o encontra, e nenhum destino dele entra
      // na ordem de tabulação.
      await expect(popupAberto()).toBeNull();
      await expect(canvas.queryByRole("link", { name: "Plano Inicial" })).toBeNull();
    });

    await step("O gatilho anuncia o estado recolhido", async () => {
      const gatilho = canvas.getByRole("button", { name: /Produtos/ });
      await expect(gatilho).toHaveAttribute("aria-expanded", "false");
      await expect(gatilho.hasAttribute("data-popup-open")).toBe(false);
    });
  },
};

export const Open: Story = {
  parameters: {
    covers: ["accessibility.item3", "accessibility.item6", "visual.item4"],
    // Esta story termina com o painel ABERTO; ver a nota da regra.
    a11y: { config: { rules: [REGRA_GUARDA_DE_FOCO] } },
    docs: {
      description: {
        story:
          "O item nasce aberto e a seta indicadora aponta para o gatilho. A story termina aberta de propósito: é o estado que a regressão visual precisa capturar.",
      },
    },
  },
  render: () => (
    <div style={{ ...wrapperStyle, minHeight: 360 }}>
      <NavigationMenu aria-label="Navegação principal" defaultValue="produtos" indicator>
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
                <li>
                  <NavigationMenuChild href="#empresarial">
                    <div className="nds-navigation-menu-child-label">Plano Empresarial</div>
                  </NavigationMenuChild>
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
    const gatilho = canvas.getByRole("button", { name: /Produtos/ });
    const painel = await esperarPainel();
    const popup = painel.closest<HTMLElement>(".nds-navigation-menu-popup");

    await step("O item nasce aberto e o gatilho reflete o estado", async () => {
      await expect(gatilho).toHaveAttribute("aria-expanded", "true");
      await expect(within(painel).getAllByRole("link")).toHaveLength(3);
    });

    await step("O gatilho aponta para o painel que abriu", async () => {
      const alvo = gatilho.getAttribute("aria-controls");
      await expect(alvo).toBeTruthy();
      await expect(popup?.id).toBe(alvo);
    });

    await step("A seta indicadora existe enquanto o painel está aberto", async () => {
      const seta = document.body.querySelector('[data-slot="navigation-menu-indicator"]');
      await expect(seta).toBeTruthy();
      // Decorativa: quem lê a tela já tem `aria-expanded` no gatilho.
      await expect(seta?.getAttribute("aria-hidden")).toBe("true");
    });

    await step("O fundo do painel é opaco", async () => {
      // O contraste de 4.5:1 que o axe mede entre o texto do destino e o fundo
      // do painel só significa alguma coisa se o fundo for opaco: sobre um
      // painel translúcido a razão medida é a do que estiver por baixo.
      const fundo = getComputedStyle(popup as HTMLElement).backgroundColor;
      await expect(fundo).not.toBe("rgba(0, 0, 0, 0)");
      await expect(fundo.startsWith("rgba(")).toBe(false);
    });
  },
};

export const Active: Story = {
  parameters: {
    covers: ["functional.item6", "accessibility.item4", "visual.item3"],
    docs: {
      description: {
        story:
          'O destino da página atual leva aria-current="page" — o leitor de tela anuncia "página atual" e o fundo muda, porque cor sozinha não informa quem não a distingue.',
      },
    },
  },
  render: () => (
    <div style={wrapperStyle}>
      <NavigationMenu aria-label="Navegação principal">
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuLink href="#inicio" active>
              Início
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink href="#produtos">Produtos</NavigationMenuLink>
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
    const atual = canvas.getByRole("link", { name: "Início" });
    const outro = canvas.getByRole("link", { name: "Sobre" });

    await step("A página atual é anunciada como tal", async () => {
      await expect(atual).toHaveAttribute("aria-current", "page");
      await expect(outro.hasAttribute("aria-current")).toBe(false);
    });

    await step("O destaque não depende só do texto: o fundo muda", async () => {
      // Critério 1.4.1 na prática. O seletor do CSS é
      // `.nds-navigation-menu-link[aria-current="page"]` — se o atributo não
      // chegasse, esta asserção pegaria o mesmo fundo do destino vizinho.
      await expect(getComputedStyle(atual).backgroundColor).not.toBe(
        getComputedStyle(outro).backgroundColor,
      );
    });
  },
};
