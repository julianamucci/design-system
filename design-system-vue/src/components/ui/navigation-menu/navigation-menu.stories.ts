import type { Meta, StoryObj } from '@storybook/vue3';
import { userEvent, within, expect, waitFor } from 'storybook/test';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from './index';
import NavigationMenuDocs from '@/components/docs/NavigationMenuDocs.vue';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const meta = {
  title: 'UI/NavigationMenu',
  component: NavigationMenu,
  tags: ['autodocs'],
  parameters: {
    docs: {
      page: withAutoDocsTab(NavigationMenuDocs),
      description: {
        component:
          'NavigationMenu (reka-ui) é um menu de navegação principal para sites e produtos web. Triggers expandem Content em hover/focus dentro de um Viewport compartilhado, com Indicator opcional. role="navigation" + aria-label são obrigatórios.',
      },
    },
  },
  argTypes: {
    defaultValue: {
      control: 'text',
      description: 'Item ativo inicial em modo não-controlado (use o value de cada NavigationMenuItem).',
    },
    delayDuration: {
      control: { type: 'number', min: 0, max: 1000, step: 50 },
      description: 'Delay em ms antes de abrir Content em hover.',
    },
    orientation: {
      control: 'inline-radio',
      options: ['horizontal', 'vertical'],
      description: 'Orientação da lista de items.',
    },
  },
  args: {
    defaultValue: '',
    delayDuration: 80,
    orientation: 'horizontal',
  },
} satisfies Meta<typeof NavigationMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => ({
    components: {
      NavigationMenu,
      NavigationMenuContent,
      NavigationMenuItem,
      NavigationMenuLink,
      NavigationMenuList,
      NavigationMenuTrigger,
    },
    setup() {
      return { args };
    },
    template: `
      <div style="contain: layout; min-height: 320px;" class="w-full flex justify-center">
        <NavigationMenu
          :key="String(args.defaultValue) + String(args.delayDuration) + String(args.orientation)"
          v-bind="args"
          aria-label="Navegação principal"
        >
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink href="#" :active="true">Início</NavigationMenuLink>
            </NavigationMenuItem>
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
            <NavigationMenuItem value="solucoes">
              <NavigationMenuTrigger>Soluções</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul class="grid w-[600px] grid-cols-2 gap-3 p-4">
                  <li><NavigationMenuLink href="#">Solução 1</NavigationMenuLink></li>
                  <li><NavigationMenuLink href="#">Solução 2</NavigationMenuLink></li>
                  <li><NavigationMenuLink href="#">Solução 3</NavigationMenuLink></li>
                  <li><NavigationMenuLink href="#">Solução 4</NavigationMenuLink></li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink href="#">Sobre</NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);

    await step('1. Root tem role=navigation com aria-label', async () => {
      const nav = canvas.getByRole('navigation', { name: /Navegação principal/i });
      await expect(nav).toBeInTheDocument();
    });

    await step('2. Trigger Produtos tem aria-haspopup', async () => {
      const trigger = canvas.getByRole('button', { name: /Produtos/i });
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    await step('3. Link ativo tem aria-current=page', async () => {
      const activeLink = canvas.getByRole('link', { name: /^Início$/i });
      await expect(activeLink).toHaveAttribute('aria-current', 'page');
    });

    await step('4. Hover/click no Trigger abre Content', async () => {
      const trigger = canvas.getByRole('button', { name: /Produtos/i });
      await userEvent.click(trigger);
      await waitFor(async () => {
        await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      });
      const productLink = await body.findByRole('link', { name: /Produto A/i });
      await expect(productLink).toBeVisible();
    });

    await step('5. ESC fecha o Content', async () => {
      await userEvent.keyboard('{Escape}');
      await waitFor(async () => {
        const trigger = canvas.getByRole('button', { name: /Produtos/i });
        await expect(trigger).toHaveAttribute('aria-expanded', 'false');
      }, { timeout: 1500 });
    });
  },
};
