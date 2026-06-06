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
  title: 'UI/NavigationMenu/Variantes',
  component: NavigationMenu,
  tags: ['navigation'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Variantes de orientação do NavigationMenu: Horizontal (padrão para header) e Vertical (sidebar/mobile drawer).',
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

export const Horizontal: Story = {
  parameters: {
    docs: { description: { story: 'Lista horizontal de items; padrão para header de site. Triggers e Content posicionados acima/abaixo.' } },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout; min-height: 240px;" class="w-full flex justify-center">
        <NavigationMenu aria-label="Navegação principal" :delay-duration="80">
          <NavigationMenuList>
            <NavigationMenuItem><NavigationMenuLink href="#" :active="true">Início</NavigationMenuLink></NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Produtos</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul class="grid w-[300px] gap-2 p-3">
                  <li><NavigationMenuLink href="#">Produto A</NavigationMenuLink></li>
                  <li><NavigationMenuLink href="#">Produto B</NavigationMenuLink></li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem><NavigationMenuLink href="#">Sobre</NavigationMenuLink></NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const nav = canvas.getByRole('navigation', { name: /Navegação principal/i });
    await expect(nav).toBeVisible();
    await expect(nav).toHaveAttribute('aria-orientation', 'horizontal');
  },
};

export const Vertical: Story = {
  parameters: {
    docs: { description: { story: 'Lista vertical (orientation=vertical); usado em sidebars ou mobile drawers.' } },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout; min-height: 240px;" class="w-full flex justify-start">
        <NavigationMenu orientation="vertical" aria-label="Navegação lateral" :delay-duration="80">
          <NavigationMenuList class="flex-col items-start gap-1">
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
    const nav = canvas.getByRole('navigation', { name: /Navegação lateral/i });
    await expect(nav).toBeVisible();
    await expect(nav).toHaveAttribute('aria-orientation', 'vertical');
  },
};
