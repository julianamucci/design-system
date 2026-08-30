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
import {
  open,
  waitForPanel,
  waitForPanelVanish,
  popupOpen,
} from "./navigation-menu.fixtures";
import {
  navigationMenuHighlightSource,
  navigationMenuMegaMenuSource,
  navigationMenuSomenteTargetsSource,
  navigationMenuSource,
} from "./navigation-menu.source";
import { FOCUS_RULE_GUARDA } from "@/lib/wait-for-portal";

const meta = {
  title: "Primitives/Navigation/NavigationMenu/Compositions",
  tags: ["navigation"],
  component: NavigationMenu,
  parameters: {
    layout: "centered",
    // Sem `argTypes` nesta meta: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // Cascateia para WithDropdown, que é a forma do meta: um gatilho com
      // lista vertical de destinos.
      source: { transform: navigationMenuSource },
      description: {
        component:
          "As quatro formas canônicas do painel, do mais simples ao mais denso: só destinos diretos, um item com lista vertical, um mega-menu em duas colunas com descrição e um painel com destino em destaque ao lado dos complementares.",
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

/**
 * Impede a navegação de verdade, como um roteador de cliente faria.
 *
 * Sem isto o clique tira a própria PÁGINA DE TESTE do ar — a conexão do runner
 * com o navegador morre e a story inteira some do resultado, sem asserção
 * nenhuma falhando.
 */
function aoNavegar(event: React.MouseEvent): void {
  event.preventDefault();
}

export const SimpleLink: Story = {
  parameters: {
    docs: {
      // A ausência de painel É o assunto: sem hierarquia não há gatilho nenhum
      // na barra, e o snippet do meta traz justamente um.
      source: { transform: navigationMenuSomenteTargetsSource },
      description: {
        story:
          "Apenas destinos diretos, sem painel — ideal para três a cinco categorias planas.",
      },
    },
  },
  render: () => (
    <div style={wrapperStyle}>
      <NavigationMenu aria-label="Navegação institucional">
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuLink href="#inicio" active>
              Início
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink href="#precos">Preços</NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink href="#contato">Contato</NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Sem gatilho: cada item navega no clique", async () => {
      // É a diferença que decide se o NavigationMenu vale a pena. Sem hierarquia
      // não há painel — e sem painel não há botão nenhum na barra.
      await expect(canvas.getAllByRole("link")).toHaveLength(3);
      await expect(canvas.queryAllByRole("button")).toHaveLength(0);
    });

    await step("O foco percorre a barra pelas setas", async () => {
      const links = canvas.getAllByRole("link");
      links[0].focus();
      await userEvent.keyboard("{ArrowRight}");
      await expect(document.activeElement).toBe(links[1]);
    });
  },
};

export const WithDropdown: Story = {
  parameters: {
    covers: ["functional.item5"],
    docs: {
      description: {
        story:
          'Um gatilho com lista vertical de destinos — padrão comum para três a oito páginas relacionadas.',
      },
    },
  },
  render: () => (
    <div style={wrapperStyle}>
      <NavigationMenu aria-label="Navegação principal">
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuLink href="#inicio" onClick={aoNavegar}>
              Início
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem value="planos">
            <NavigationMenuTrigger>Planos</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="nds-stack nds-list-none nds-w-xs" data-spacing="xs">
                <li>
                  <NavigationMenuChild href="#inicial" onClick={aoNavegar}>
                    <div className="nds-navigation-menu-child-label">Plano Inicial</div>
                  </NavigationMenuChild>
                </li>
                <li>
                  <NavigationMenuChild href="#profissional" onClick={aoNavegar}>
                    <div className="nds-navigation-menu-child-label">Plano Profissional</div>
                  </NavigationMenuChild>
                </li>
                <li>
                  <NavigationMenuChild href="#empresarial" onClick={aoNavegar}>
                    <div className="nds-navigation-menu-child-label">Plano Empresarial</div>
                  </NavigationMenuChild>
                </li>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink href="#contato" onClick={aoNavegar}>
              Contato
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: /Planos/ });

    await step("O painel abre com os três destinos", async () => {
      const panel = await open(trigger);
      await expect(within(panel).getAllByRole("link")).toHaveLength(3);
    });

    await step("Escolher um destino fecha o painel", async () => {
      // Navegar É sair da página: um painel que sobrevive ao clique fica
      // pendurado sobre a página seguinte.
      const panel = await waitForPanel();
      await userEvent.click(within(panel).getByRole("link", { name: "Plano Profissional" }));
      await waitForPanelVanish();
      await expect(trigger).toHaveAttribute("aria-expanded", "false");
    });

    await step("O foco volta a ser alcançável na barra", async () => {
      await expect(popupOpen()).toBeNull();
      await expect(canvas.getAllByRole("link")).toHaveLength(2);
    });
  },
};

export const MegaMenuGrid: Story = {
  parameters: {
    covers: ["visual.item2"],
    // Esta story termina com o painel ABERTO; ver a nota da regra.
    a11y: { config: { rules: [FOCUS_RULE_GUARDA] } },
    docs: {
      // Grade de duas colunas com uma linha de contexto por destino: a
      // descrição é o que atende ao propósito do link, e o meta não a tem.
      source: { transform: navigationMenuMegaMenuSource },
      description: {
        story:
          "Painel em duas colunas, com título e uma linha de contexto por destino — útil para apresentar soluções sem obrigar o leitor a adivinhar o que há do outro lado.",
      },
    },
  },
  render: () => (
    <div style={{ ...wrapperStyle, minHeight: 420 }}>
      <NavigationMenu aria-label="Navegação de soluções" defaultValue="solucoes">
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuLink href="#inicio">Início</NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem value="solucoes">
            <NavigationMenuTrigger>Soluções</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul
                className="nds-grid nds-list-none nds-w-lg"
                data-fixed
                data-cols="2"
                data-spacing="sm"
              >
                <li>
                  <NavigationMenuChild href="#marketing">
                    <div className="nds-navigation-menu-child-label">Para Marketing</div>
                    <p className="nds-navigation-menu-child-description">
                      Campanhas, automação e atribuição num lugar só.
                    </p>
                  </NavigationMenuChild>
                </li>
                <li>
                  <NavigationMenuChild href="#vendas">
                    <div className="nds-navigation-menu-child-label">Para Vendas</div>
                    <p className="nds-navigation-menu-child-description">
                      Funil, previsão e histórico de cada negociação.
                    </p>
                  </NavigationMenuChild>
                </li>
                <li>
                  <NavigationMenuChild href="#suporte">
                    <div className="nds-navigation-menu-child-label">Para Suporte</div>
                    <p className="nds-navigation-menu-child-description">
                      Fila de atendimento, base de conhecimento e métricas.
                    </p>
                  </NavigationMenuChild>
                </li>
                <li>
                  <NavigationMenuChild href="#financeiro">
                    <div className="nds-navigation-menu-child-label">Para Financeiro</div>
                    <p className="nds-navigation-menu-child-description">
                      Cobrança recorrente, conciliação e relatórios fiscais.
                    </p>
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
    const panel = await waitForPanel();

    await step("Quatro destinos em duas colunas", async () => {
      const targets = [...panel.querySelectorAll<HTMLElement>("a")];
      await expect(targets).toHaveLength(4);
      // Duas colunas de verdade: o segundo destino está à direita do primeiro,
      // na mesma linha; o terceiro desce.
      const [a, b, c] = targets.map((d) => d.getBoundingClientRect());
      await expect(b.left).toBeGreaterThan(a.left);
      await expect(Math.abs(b.top - a.top)).toBeLessThan(2);
      await expect(c.top).toBeGreaterThan(a.top);
    });

    await step("A descrição faz parte do nome do destino", async () => {
      // Critério 2.4.4 (Link Purpose): "Para Marketing" sozinho não diz o que
      // há do outro lado. Por isso a descrição NÃO recebe aria-hidden.
      const destination = within(panel).getByRole("link", { name: /Para Marketing/ });
      await expect(destination.textContent).toContain("Campanhas");
    });

    await step("O gatilho continua sendo o dono do painel", async () => {
      const trigger = canvas.getByRole("button", { name: /Soluções/ });
      await expect(trigger).toHaveAttribute("aria-expanded", "true");
      // Esta story termina ABERTA de propósito: é o estado que a regressão
      // visual precisa capturar.
      await expect(popupOpen()).not.toBeNull();
    });
  },
};

export const WithHighlightedCard: Story = {
  parameters: {
    // Esta story termina com o painel ABERTO; ver a nota da regra.
    a11y: { config: { rules: [FOCUS_RULE_GUARDA] } },
    docs: {
      // Destino em destaque ao lado de uma lista de apoio: a hierarquia vem do
      // tamanho do bloco, e some se o snippet mostrar só a lista.
      source: { transform: navigationMenuHighlightSource },
      description: {
        story:
          "Um destino em destaque ao lado dos complementares — a hierarquia aparece pelo tamanho do bloco, não por cor.",
      },
    },
  },
  render: () => (
    <div style={{ ...wrapperStyle, minHeight: 420 }}>
      <NavigationMenu aria-label="Navegação de recursos">
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuLink href="#inicio">Início</NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem value="recursos">
            <NavigationMenuTrigger>Recursos</NavigationMenuTrigger>
            <NavigationMenuContent>
              <div
                className="nds-grid nds-w-lg"
                data-fixed
                data-cols="2"
                data-spacing="sm"
              >
                <NavigationMenuChild href="#comece" className="nds-h-full">
                  <div className="nds-navigation-menu-child-label">Comece agora</div>
                  <p className="nds-navigation-menu-child-description">
                    Publique o primeiro projeto em menos de cinco minutos.
                  </p>
                </NavigationMenuChild>

                <ul className="nds-stack nds-list-none" data-spacing="xs">
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
                  <li>
                    <NavigationMenuChild href="#changelog">
                      <div className="nds-navigation-menu-child-label">Novidades</div>
                    </NavigationMenuChild>
                  </li>
                </ul>
              </div>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: /Recursos/ });
    const panel = await open(trigger);

    await step("Um destino em destaque e três de apoio", async () => {
      const targets = [...panel.querySelectorAll<HTMLElement>("a")];
      await expect(targets).toHaveLength(4);
      // O destaque ocupa a coluna inteira: é mais alto que qualquer um dos
      // complementares, que é como a hierarquia aparece sem depender de cor.
      const highlight = targets[0].getBoundingClientRect();
      const helper = targets[1].getBoundingClientRect();
      await expect(highlight.height).toBeGreaterThan(helper.height);
    });

    await step("Tab alcança todo o painel portalizado", async () => {
      // O painel mora no <body>, fora do canvas — se os destinos não fossem
      // tabuláveis, o conteúdo ficaria inalcançável por teclado.
      const targets = [...panel.querySelectorAll<HTMLElement>("a")];
      for (const destination of targets) {
        await expect(destination.getAttribute("tabindex")).not.toBe("-1");
      }
      targets[0].focus();
      await expect(document.activeElement).toBe(targets[0]);
      await userEvent.tab();
      await expect(panel.contains(document.activeElement)).toBe(true);
    });
  },
};
