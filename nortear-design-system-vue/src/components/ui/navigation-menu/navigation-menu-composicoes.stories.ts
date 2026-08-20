import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, expect, userEvent } from 'storybook/test';
import {
  NavigationMenu,
  NavigationMenuChild,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from './index';
import { abrir, esperarPainel, esperarPainelSumir, painelAberto } from './navigation-menu.fixtures';
import { REGRA_GUARDA_DE_FOCO } from '@/lib/wait-for-portal';
import {
  navigationMenuComDestaqueSource,
  navigationMenuComPainelSource,
  navigationMenuMegaMenuSource,
  navigationMenuSomenteLinksSource,
} from './navigation-menu.source';

const meta = {
  title: 'UI/NavigationMenu/Compositions',
  component: NavigationMenu,
  tags: ['navigation'],
  parameters: {
    layout: 'centered',
    // Sem `argTypes` nesta meta: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: navigationMenuSomenteLinksSource },
      description: {
        component:
          'As quatro formas canônicas do painel, do mais simples ao mais denso: só destinos diretos, um item com lista vertical, um mega-menu em duas colunas com descrição e um painel com destino em destaque ao lado dos complementares.',
      },
    },
  },
} satisfies Meta<typeof NavigationMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

const sharedComponents = {
  NavigationMenu,
  NavigationMenuChild,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
};

/**
 * Impede a navegação de verdade, como um roteador de cliente faria.
 *
 * Sem isto o clique tira a própria PÁGINA DE TESTE do ar — a conexão do runner
 * com o navegador morre e a story inteira some do resultado, sem asserção
 * nenhuma falhando.
 */
function aoNavegar(event: Event): void {
  event.preventDefault();
}

export const SimpleLink: Story = {
  parameters: {
    docs: { description: { story: 'Apenas destinos diretos, sem painel — ideal para três a cinco categorias planas.' } },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout; min-height: 120px;" class="nds-cluster nds-w-full" data-justify="center">
        <NavigationMenu aria-label="Navegação institucional">
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink href="#inicio" :active="true">Início</NavigationMenuLink>
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
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Sem gatilho: cada item navega no clique', async () => {
      // É a diferença que decide se o NavigationMenu vale a pena. Sem hierarquia
      // não há painel — e sem painel não há botão nenhum na barra.
      await expect(canvas.getAllByRole('link')).toHaveLength(3);
      await expect(canvas.queryAllByRole('button')).toHaveLength(0);
    });

    await step('O foco percorre a barra pelas setas', async () => {
      const links = canvas.getAllByRole('link');
      links[0].focus();
      await userEvent.keyboard('{ArrowRight}');
      await expect(document.activeElement).toBe(links[1]);
    });
  },
};

export const WithDropdown: Story = {
  parameters: {
    covers: ['functional.item5'],
    docs: {
      // Entra o par gatilho/painel, que a barra plana do meta não tem: é a
      // diferença que decide se o componente vale a pena.
      source: { transform: navigationMenuComPainelSource },
      description: { story: 'Um gatilho com lista vertical de destinos — padrão comum para três a oito páginas relacionadas.' },
    },
  },
  render: () => ({
    components: sharedComponents,
    setup() {
      return { aoNavegar };
    },
    template: `
      <div style="contain: layout; min-height: 280px;" class="nds-cluster nds-w-full" data-justify="center">
        <NavigationMenu aria-label="Navegação principal">
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink href="#inicio" @click="aoNavegar">Início</NavigationMenuLink>
            </NavigationMenuItem>

            <NavigationMenuItem value="planos">
              <NavigationMenuTrigger>Planos</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul class="nds-stack nds-list-none nds-w-xs" data-spacing="xs">
                  <li>
                    <NavigationMenuChild href="#inicial" @click="aoNavegar">
                      <div class="nds-navigation-menu-child-label">Plano Inicial</div>
                    </NavigationMenuChild>
                  </li>
                  <li>
                    <NavigationMenuChild href="#profissional" @click="aoNavegar">
                      <div class="nds-navigation-menu-child-label">Plano Profissional</div>
                    </NavigationMenuChild>
                  </li>
                  <li>
                    <NavigationMenuChild href="#empresarial" @click="aoNavegar">
                      <div class="nds-navigation-menu-child-label">Plano Empresarial</div>
                    </NavigationMenuChild>
                  </li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuLink href="#contato" @click="aoNavegar">Contato</NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const gatilho = canvas.getByRole('button', { name: /Planos/ });

    await step('O painel abre com os três destinos', async () => {
      const conteudo = await abrir(gatilho);
      await expect(within(conteudo).getAllByRole('link')).toHaveLength(3);
    });

    await step('Escolher um destino fecha o painel', async () => {
      // Navegar É sair da página: um painel que sobrevive ao clique fica
      // pendurado sobre a página seguinte.
      const conteudo = await esperarPainel();
      await userEvent.click(within(conteudo).getByRole('link', { name: 'Plano Profissional' }));
      await esperarPainelSumir();
      await expect(gatilho).toHaveAttribute('aria-expanded', 'false');
    });

    await step('O foco volta a ser alcançável na barra', async () => {
      await expect(painelAberto()).toBeNull();
      await expect(canvas.getAllByRole('link')).toHaveLength(2);
    });
  },
};

export const MegaMenuGrid: Story = {
  parameters: {
    covers: ['visual.item2'],
    // Esta story termina com o painel ABERTO; ver a nota da regra.
    a11y: { config: { rules: [REGRA_GUARDA_DE_FOCO] } },
    docs: {
      // Grade de duas colunas e descrição por destino: nenhuma outra story do
      // arquivo mostra a linha de contexto dentro do bloco.
      source: { transform: navigationMenuMegaMenuSource },
      description: {
        story:
          'Painel em duas colunas, com título e uma linha de contexto por destino — útil para apresentar soluções sem obrigar o leitor a adivinhar o que há do outro lado.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout; min-height: 360px;" class="nds-cluster nds-w-full" data-justify="center">
        <NavigationMenu aria-label="Navegação de soluções" default-value="solucoes">
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink href="#inicio">Início</NavigationMenuLink>
            </NavigationMenuItem>

            <NavigationMenuItem value="solucoes">
              <NavigationMenuTrigger>Soluções</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul class="nds-grid nds-list-none nds-w-lg" data-fixed data-cols="2" data-spacing="sm">
                  <li>
                    <NavigationMenuChild href="#marketing">
                      <div class="nds-navigation-menu-child-label">Para Marketing</div>
                      <p class="nds-navigation-menu-child-description">
                        Campanhas, automação e atribuição num lugar só.
                      </p>
                    </NavigationMenuChild>
                  </li>
                  <li>
                    <NavigationMenuChild href="#vendas">
                      <div class="nds-navigation-menu-child-label">Para Vendas</div>
                      <p class="nds-navigation-menu-child-description">
                        Funil, previsão e histórico de cada negociação.
                      </p>
                    </NavigationMenuChild>
                  </li>
                  <li>
                    <NavigationMenuChild href="#suporte">
                      <div class="nds-navigation-menu-child-label">Para Suporte</div>
                      <p class="nds-navigation-menu-child-description">
                        Fila de atendimento, base de conhecimento e métricas.
                      </p>
                    </NavigationMenuChild>
                  </li>
                  <li>
                    <NavigationMenuChild href="#financeiro">
                      <div class="nds-navigation-menu-child-label">Para Financeiro</div>
                      <p class="nds-navigation-menu-child-description">
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
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const conteudo = await esperarPainel();

    await step('Quatro destinos em duas colunas', async () => {
      const destinos = [...conteudo.querySelectorAll<HTMLElement>('a')];
      await expect(destinos).toHaveLength(4);
      // Duas colunas de verdade: o segundo destino está à direita do primeiro,
      // na mesma linha; o terceiro desce.
      const [a, b, c] = destinos.map((d) => d.getBoundingClientRect());
      await expect(b.left).toBeGreaterThan(a.left);
      await expect(Math.abs(b.top - a.top)).toBeLessThan(2);
      await expect(c.top).toBeGreaterThan(a.top);
    });

    await step('A descrição faz parte do nome do destino', async () => {
      // Critério 2.4.4 (Link Purpose): "Para Marketing" sozinho não diz o que
      // há do outro lado. Por isso a descrição NÃO recebe aria-hidden.
      const destino = within(conteudo).getByRole('link', { name: /Para Marketing/ });
      await expect(destino.textContent).toContain('Campanhas');
    });

    await step('O gatilho continua sendo o dono do painel', async () => {
      const gatilho = canvas.getByRole('button', { name: /Soluções/ });
      await expect(gatilho).toHaveAttribute('aria-expanded', 'true');
      // Esta story termina ABERTA de propósito: é o estado que a regressão
      // visual precisa capturar.
      await expect(painelAberto()).not.toBeNull();
    });
  },
};

export const WithHighlightedCard: Story = {
  parameters: {
    // Esta story termina com o painel ABERTO; ver a nota da regra.
    a11y: { config: { rules: [REGRA_GUARDA_DE_FOCO] } },
    docs: {
      // O destaque é um destino SOLTO na grade, irmão da lista de apoio — não
      // há `<li>` em volta dele, e é isso que o deixa ocupar a coluna inteira.
      source: { transform: navigationMenuComDestaqueSource },
      description: {
        story:
          'Um destino em destaque ao lado dos complementares — a hierarquia aparece pelo tamanho do bloco, não por cor.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout; min-height: 360px;" class="nds-cluster nds-w-full" data-justify="center">
        <NavigationMenu aria-label="Navegação de recursos">
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink href="#inicio">Início</NavigationMenuLink>
            </NavigationMenuItem>

            <NavigationMenuItem value="recursos">
              <NavigationMenuTrigger>Recursos</NavigationMenuTrigger>
              <NavigationMenuContent>
                <div class="nds-grid nds-w-lg" data-fixed data-cols="2" data-spacing="sm">
                  <NavigationMenuChild href="#comece" class="nds-h-full">
                    <div class="nds-navigation-menu-child-label">Comece agora</div>
                    <p class="nds-navigation-menu-child-description">
                      Publique o primeiro projeto em menos de cinco minutos.
                    </p>
                  </NavigationMenuChild>

                  <ul class="nds-stack nds-list-none" data-spacing="xs">
                    <li>
                      <NavigationMenuChild href="#guias">
                        <div class="nds-navigation-menu-child-label">Guias</div>
                      </NavigationMenuChild>
                    </li>
                    <li>
                      <NavigationMenuChild href="#api">
                        <div class="nds-navigation-menu-child-label">Referência da API</div>
                      </NavigationMenuChild>
                    </li>
                    <li>
                      <NavigationMenuChild href="#changelog">
                        <div class="nds-navigation-menu-child-label">Novidades</div>
                      </NavigationMenuChild>
                    </li>
                  </ul>
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const gatilho = canvas.getByRole('button', { name: /Recursos/ });
    const conteudo = await abrir(gatilho);

    await step('Um destino em destaque e três de apoio', async () => {
      const destinos = [...conteudo.querySelectorAll<HTMLElement>('a')];
      await expect(destinos).toHaveLength(4);
      // O destaque ocupa a coluna inteira: é mais alto que qualquer um dos
      // complementares, que é como a hierarquia aparece sem depender de cor.
      const destaque = destinos[0].getBoundingClientRect();
      const apoio = destinos[1].getBoundingClientRect();
      await expect(destaque.height).toBeGreaterThan(apoio.height);
    });

    await step('Tab alcança todo o painel', async () => {
      const destinos = [...conteudo.querySelectorAll<HTMLElement>('a')];
      for (const destino of destinos) {
        await expect(destino.getAttribute('tabindex')).not.toBe('-1');
      }
      destinos[0].focus();
      await expect(document.activeElement).toBe(destinos[0]);
      await userEvent.tab();
      await expect(conteudo.contains(document.activeElement)).toBe(true);
    });
  },
};
