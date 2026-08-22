import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, expect } from 'storybook/test';
import {
  NavigationMenu,
  NavigationMenuChild,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from './index';
import { esperarPainel, painelAberto } from './navigation-menu.fixtures';
import { REGRA_GUARDA_DE_FOCO } from '@/lib/wait-for-portal';
import {
  navigationMenuAbertoSource,
  navigationMenuAtivoSource,
  navigationMenuClosedSource,
} from './navigation-menu.source';

const meta = {
  title: 'UI/NavigationMenu/States',
  component: NavigationMenu,
  tags: ['navigation'],
  parameters: {
    layout: 'centered',
    // Sem `argTypes` nesta meta: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: navigationMenuClosedSource },
      description: {
        component:
          'Os três estados canônicos: Fechado (só a barra), Aberto (painel do item ativo) e Ativo (o destino da página atual).',
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
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
};

export const Closed: Story = {
  parameters: {
    covers: ['accessibility.item1'],
    docs: { description: { story: 'Estado padrão — apenas gatilhos e destinos visíveis na barra; nenhum painel aberto.' } },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout" class="nds-cluster nds-w-full nds-min-h-30" data-justify="center">
        <NavigationMenu aria-label="Navegação principal">
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink href="#inicio">Início</NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem value="produtos">
              <NavigationMenuTrigger>Produtos</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul class="nds-stack nds-list-none nds-w-xs" data-spacing="xs">
                  <li>
                    <NavigationMenuChild href="#inicial">
                      <div class="nds-navigation-menu-child-label">Plano Inicial</div>
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
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Fechado, o painel não existe no DOM', async () => {
      // O miolo do painel é DESMONTADO ao fechar. Não é um bloco escondido:
      // quem navega com leitor de tela não o encontra, e nenhum destino dele
      // entra na ordem de tabulação.
      await expect(painelAberto()).toBeNull();
      await expect(canvas.queryByRole('link', { name: 'Plano Inicial' })).toBeNull();
    });

    await step('O gatilho anuncia o estado recolhido', async () => {
      const gatilho = canvas.getByRole('button', { name: /Produtos/ });
      await expect(gatilho).toHaveAttribute('aria-expanded', 'false');
      await expect(gatilho).toHaveAttribute('data-state', 'closed');
    });
  },
};

export const Open: Story = {
  parameters: {
    covers: ['accessibility.item3', 'accessibility.item6', 'visual.item4'],
    // Esta story termina com o painel ABERTO; ver a nota da regra.
    a11y: { config: { rules: [REGRA_GUARDA_DE_FOCO] } },
    docs: {
      // Aberto na montagem é PRESENÇA de `default-value`, e traz junto a seta
      // indicadora — peça que a do meta, fechada, não tem por que mostrar.
      source: { transform: navigationMenuAbertoSource },
      description: {
        story:
          'O item nasce aberto e a seta indicadora aponta para o gatilho. A story termina aberta de propósito: é o estado que a regressão visual precisa capturar.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout" class="nds-cluster nds-w-full nds-min-h-80" data-justify="center">
        <NavigationMenu aria-label="Navegação principal" default-value="produtos">
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink href="#inicio">Início</NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem value="produtos">
              <NavigationMenuTrigger>Produtos</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul class="nds-stack nds-list-none nds-w-xs" data-spacing="xs">
                  <li>
                    <NavigationMenuChild href="#inicial">
                      <div class="nds-navigation-menu-child-label">Plano Inicial</div>
                    </NavigationMenuChild>
                  </li>
                  <li>
                    <NavigationMenuChild href="#profissional">
                      <div class="nds-navigation-menu-child-label">Plano Profissional</div>
                    </NavigationMenuChild>
                  </li>
                  <li>
                    <NavigationMenuChild href="#empresarial">
                      <div class="nds-navigation-menu-child-label">Plano Empresarial</div>
                    </NavigationMenuChild>
                  </li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuIndicator />
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const gatilho = canvas.getByRole('button', { name: /Produtos/ });
    const conteudo = await esperarPainel();
    const painel = conteudo.closest<HTMLElement>('.nds-navigation-menu-viewport-panel');

    await step('O item nasce aberto e o gatilho reflete o estado', async () => {
      await expect(gatilho).toHaveAttribute('aria-expanded', 'true');
      await expect(within(conteudo).getAllByRole('link')).toHaveLength(3);
    });

    await step('O gatilho aponta para o painel que abriu', async () => {
      const alvo = gatilho.getAttribute('aria-controls');
      await expect(alvo).toBeTruthy();
      await expect(document.getElementById(alvo as string)).toBeTruthy();
    });

    await step('A seta indicadora existe enquanto o painel está aberto', async () => {
      const seta = document.body.querySelector('[data-slot="navigation-menu-indicator"]');
      await expect(seta).toBeTruthy();
      await expect(seta?.querySelector('.nds-navigation-menu-indicator-arrow')).toBeTruthy();
    });

    await step('O fundo do painel é opaco', async () => {
      // O contraste de 4.5:1 que o axe mede entre o texto do destino e o fundo
      // do painel só significa alguma coisa se o fundo for opaco: sobre um
      // painel translúcido a razão medida é a do que estiver por baixo.
      const fundo = getComputedStyle(painel as HTMLElement).backgroundColor;
      await expect(fundo).not.toBe('rgba(0, 0, 0, 0)');
      await expect(fundo.startsWith('rgba(')).toBe(false);
    });
  },
};

export const Active: Story = {
  parameters: {
    covers: ['functional.item6', 'accessibility.item4', 'visual.item3'],
    docs: {
      // A marca da página atual mora no DESTINO, e é uma barra plana: nenhum
      // gatilho, nenhum painel — o oposto da composição do meta.
      source: { transform: navigationMenuAtivoSource },
      description: {
        story:
          'O destino da página atual leva aria-current="page" — o leitor de tela anuncia "página atual" e o fundo muda, porque cor sozinha não informa quem não a distingue.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout" class="nds-cluster nds-w-full nds-min-h-30" data-justify="center">
        <NavigationMenu aria-label="Navegação principal">
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink href="#inicio" :active="true">Início</NavigationMenuLink>
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
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const atual = canvas.getByRole('link', { name: 'Início' });
    const outro = canvas.getByRole('link', { name: 'Sobre' });

    await step('A página atual é anunciada como tal', async () => {
      await expect(atual).toHaveAttribute('aria-current', 'page');
      await expect(outro.hasAttribute('aria-current')).toBe(false);
    });

    await step('O destaque não depende só do texto: o fundo muda', async () => {
      // Critério 1.4.1 na prática. O seletor do CSS é
      // `.nds-navigation-menu-link[aria-current="page"]` — se o atributo não
      // chegasse, esta asserção pegaria o mesmo fundo do destino vizinho.
      await expect(getComputedStyle(atual).backgroundColor).not.toBe(
        getComputedStyle(outro).backgroundColor,
      );
    });
  },
};
