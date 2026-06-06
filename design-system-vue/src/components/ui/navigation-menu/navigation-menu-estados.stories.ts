import type { Meta, StoryObj } from '@storybook/vue3';
import { within, expect } from 'storybook/test';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from './index';

const meta = {
  title: 'UI/NavigationMenu/Estados',
  component: NavigationMenu,
  tags: ['navigation'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Estados canônicos do NavigationMenu: Fechado (apenas Triggers), Aberto (defaultValue abre Content) e Ativo (Link com aria-current="page").',
      },
    },
  },
} satisfies Meta<typeof NavigationMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

const sharedComponents = {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
};

export const Fechado: Story = {
  parameters: {
    docs: { description: { story: 'Estado padrão — apenas Triggers e Links visíveis na barra; Viewport vazio.' } },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout; min-height: 80px;" class="w-full flex justify-center">
        <NavigationMenu aria-label="Navegação principal" :delay-duration="80">
          <NavigationMenuList>
            <NavigationMenuItem><NavigationMenuLink href="#">Início</NavigationMenuLink></NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Produtos</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul class="grid w-[300px] gap-2 p-3"><li><NavigationMenuLink href="#">A</NavigationMenuLink></li></ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const nav = canvas.getByRole('navigation', { name: /Navegação principal/i });
    await expect(nav).toBeVisible();
    const trigger = canvas.getByRole('button', { name: /Produtos/i });
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  },
};

export const Aberto: Story = {
  parameters: {
    docs: { description: { story: 'Trigger ativo com Content expandido no Viewport via defaultValue. Captura visual no Chromatic.' } },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout; min-height: 280px;" class="w-full flex justify-center">
        <NavigationMenu aria-label="Navegação principal" :delay-duration="80" default-value="produtos">
          <NavigationMenuList>
            <NavigationMenuItem><NavigationMenuLink href="#">Início</NavigationMenuLink></NavigationMenuItem>
            <NavigationMenuItem value="produtos">
              <NavigationMenuTrigger>Produtos</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul class="grid w-[400px] gap-3 p-4">
                  <li><NavigationMenuLink href="#">Produto A</NavigationMenuLink></li>
                  <li><NavigationMenuLink href="#">Produto B</NavigationMenuLink></li>
                  <li><NavigationMenuLink href="#">Produto C</NavigationMenuLink></li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: /Produtos/i });
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(trigger).toHaveAttribute('data-state', 'open');
  },
};

export const Ativo: Story = {
  parameters: {
    docs: { description: { story: 'Link da página atual com aria-current="page" recebe estilo destacado (bg-accent).' } },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout; min-height: 80px;" class="w-full flex justify-center">
        <NavigationMenu aria-label="Navegação principal" :delay-duration="80">
          <NavigationMenuList>
            <NavigationMenuItem><NavigationMenuLink href="#" :active="true">Início</NavigationMenuLink></NavigationMenuItem>
            <NavigationMenuItem><NavigationMenuLink href="#">Sobre</NavigationMenuLink></NavigationMenuItem>
            <NavigationMenuItem><NavigationMenuLink href="#">Contato</NavigationMenuLink></NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const active = canvas.getByRole('link', { name: /^Início$/i });
    await expect(active).toHaveAttribute('aria-current', 'page');
    const inactive = canvas.getByRole('link', { name: /^Sobre$/i });
    await expect(inactive).not.toHaveAttribute('aria-current', 'page');
  },
};
