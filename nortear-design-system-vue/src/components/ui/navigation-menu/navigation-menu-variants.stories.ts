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
import { abrir, fechar } from './navigation-menu.fixtures';
import {
  navigationMenuHorizontalSource,
  navigationMenuVerticalSource,
} from './navigation-menu.source';

const meta = {
  title: 'UI/NavigationMenu/Variants',
  component: NavigationMenu,
  tags: ['navigation'],
  parameters: {
    layout: 'centered',
    // Sem `argTypes` nesta meta: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: navigationMenuHorizontalSource },
      description: {
        component:
          'As duas direções da barra. Horizontal é o cabeçalho de site, com os itens em linha; vertical é a coluna de uma barra lateral ou gaveta, com os itens empilhados.',
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

export const Horizontal: Story = {
  parameters: {
    covers: ['visual.item1'],
    docs: { description: { story: 'Padrão — itens lado a lado; usado em cabeçalhos de site e de produto web.' } },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout" class="nds-cluster nds-w-full nds-min-h-70" data-justify="center">
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
                  <li>
                    <NavigationMenuChild href="#profissional">
                      <div class="nds-navigation-menu-child-label">Plano Profissional</div>
                    </NavigationMenuChild>
                  </li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>

            <NavigationMenuItem value="recursos">
              <NavigationMenuTrigger>Recursos</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul class="nds-stack nds-list-none nds-w-xs" data-spacing="xs">
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
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Cinco itens, dois deles com painel', async () => {
      const itens = canvasElement.querySelectorAll('[data-slot="navigation-menu-item"]');
      await expect(itens).toHaveLength(5);
      await expect(canvas.getAllByRole('button')).toHaveLength(2);
      await expect(canvas.getAllByRole('link')).toHaveLength(3);
    });

    await step('Os itens ficam lado a lado, na mesma linha', async () => {
      const itens = [...canvasElement.querySelectorAll<HTMLElement>('[data-slot="navigation-menu-item"]')];
      const first = itens[0].getBoundingClientRect();
      const segundo = itens[1].getBoundingClientRect();
      await expect(segundo.left).toBeGreaterThan(first.left);
      await expect(Math.abs(segundo.top - first.top)).toBeLessThan(2);
    });

    await step('O painel abre abaixo da barra', async () => {
      const gatilho = canvas.getByRole('button', { name: /Produtos/ });
      const conteudo = await abrir(gatilho);
      const barra = canvas.getByRole('navigation', { name: 'Navegação principal' });
      await expect(conteudo.getBoundingClientRect().top).toBeGreaterThan(
        barra.getBoundingClientRect().top,
      );
      await fechar(gatilho);
    });
  },
};

export const Vertical: Story = {
  parameters: {
    covers: ['visual.item5'],
    docs: {
      // A coluna não é a linha com outra prop: a lista ganha largura e respiro
      // próprios, e some o painel que na horizontal é o assunto.
      source: { transform: navigationMenuVerticalSource },
      description: {
        story: 'Itens empilhados; usado em barras laterais e gavetas móveis. As setas Cima/Baixo percorrem a barra.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout" class="nds-cluster nds-w-full nds-min-h-70" data-justify="start">
        <NavigationMenu orientation="vertical" aria-label="Navegação da conta">
          <NavigationMenuList class="nds-stack nds-w-sm" data-spacing="xs">
            <NavigationMenuItem>
              <NavigationMenuLink href="#painel">Painel</NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink href="#relatorios">Relatórios</NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink href="#configuracoes">Configurações</NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Os itens empilham em coluna', async () => {
      const itens = [...canvasElement.querySelectorAll<HTMLElement>('[data-slot="navigation-menu-item"]')];
      await expect(itens).toHaveLength(3);
      const first = itens[0].getBoundingClientRect();
      const segundo = itens[1].getBoundingClientRect();
      await expect(segundo.top).toBeGreaterThan(first.top);
    });

    await step('As setas do eixo vertical percorrem a barra', async () => {
      const links = canvas.getAllByRole('link');
      links[0].focus();
      await userEvent.keyboard('{ArrowDown}');
      await expect(document.activeElement).toBe(links[1]);
    });
  },
};
