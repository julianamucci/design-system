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
  title: 'UI/NavigationMenu/Composicoes',
  component: NavigationMenu,
  tags: ['navigation'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Composicoes reais de NavigationMenu: LinkSimples (sem dropdown), ComDropdown (lista vertical), MegaMenuGrid (grid 2 colunas) e ComCardDestacado (card promocional + lista).',
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

export const LinkSimples: Story = {
  parameters: {
    docs: { description: { story: 'NavigationMenuLink direto, sem Trigger nem Content — para itens sem hierarquia.' } },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout; min-height: 80px;" class="w-full flex justify-center">
        <NavigationMenu aria-label="Navegação principal" :delay-duration="80">
          <NavigationMenuList>
            <NavigationMenuItem><NavigationMenuLink href="#" :active="true">Início</NavigationMenuLink></NavigationMenuItem>
            <NavigationMenuItem><NavigationMenuLink href="#">Preços</NavigationMenuLink></NavigationMenuItem>
            <NavigationMenuItem><NavigationMenuLink href="#">Documentação</NavigationMenuLink></NavigationMenuItem>
            <NavigationMenuItem><NavigationMenuLink href="#">Blog</NavigationMenuLink></NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const links = canvas.getAllByRole('link');
    await expect(links.length).toBe(4);
    await expect(links[0]).toHaveAttribute('aria-current', 'page');
  },
};

export const ComDropdown: Story = {
  parameters: {
    docs: { description: { story: 'Item com Trigger + Content em lista vertical simples — caso típico de dropdown de produtos.' } },
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
                <ul class="grid w-[320px] gap-2 p-3">
                  <li><NavigationMenuLink href="#">Plano Pro</NavigationMenuLink></li>
                  <li><NavigationMenuLink href="#">Plano Empresa</NavigationMenuLink></li>
                  <li><NavigationMenuLink href="#">API</NavigationMenuLink></li>
                  <li><NavigationMenuLink href="#">Integrações</NavigationMenuLink></li>
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
    const trigger = canvas.getByRole('button', { name: /Produtos/i });
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  },
};

export const MegaMenuGrid: Story = {
  parameters: {
    docs: { description: { story: 'Mega-menu com grid 2 colunas — adequado para 6-8 sub-links agrupados.' } },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout; min-height: 320px;" class="w-full flex justify-center">
        <NavigationMenu aria-label="Navegação principal" :delay-duration="80" default-value="solucoes">
          <NavigationMenuList>
            <NavigationMenuItem value="solucoes">
              <NavigationMenuTrigger>Soluções</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul class="grid w-[600px] grid-cols-2 gap-3 p-4">
                  <li><NavigationMenuLink href="#">Para Startups</NavigationMenuLink></li>
                  <li><NavigationMenuLink href="#">Para Enterprise</NavigationMenuLink></li>
                  <li><NavigationMenuLink href="#">Para Agências</NavigationMenuLink></li>
                  <li><NavigationMenuLink href="#">Para Educação</NavigationMenuLink></li>
                  <li><NavigationMenuLink href="#">Para Saúde</NavigationMenuLink></li>
                  <li><NavigationMenuLink href="#">Para Varejo</NavigationMenuLink></li>
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
    const trigger = canvas.getByRole('button', { name: /Soluções/i });
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    const links = within(document.body).getAllByRole('link');
    await expect(links.length).toBeGreaterThanOrEqual(6);
  },
};

export const ComCardDestacado: Story = {
  parameters: {
    docs: { description: { story: 'Mega-menu com card promocional à esquerda + lista de links à direita.' } },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout; min-height: 340px;" class="w-full flex justify-center">
        <NavigationMenu aria-label="Navegação principal" :delay-duration="80" default-value="recursos">
          <NavigationMenuList>
            <NavigationMenuItem value="recursos">
              <NavigationMenuTrigger>Recursos</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul class="grid w-[600px] grid-cols-[.75fr_1fr] gap-3 p-4">
                  <li class="row-span-3">
                    <NavigationMenuLink
                      href="#"
                      class="from-muted/50 to-muted flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b p-6 no-underline outline-hidden focus:shadow-md"
                    >
                      <div class="mt-4 mb-2 text-lg font-medium">Novidade · v3.0</div>
                      <p class="text-muted-foreground text-sm leading-tight">
                        Conheça nossa nova plataforma de design.
                      </p>
                    </NavigationMenuLink>
                  </li>
                  <li><NavigationMenuLink href="#">Documentação</NavigationMenuLink></li>
                  <li><NavigationMenuLink href="#">Guias</NavigationMenuLink></li>
                  <li><NavigationMenuLink href="#">Tutoriais</NavigationMenuLink></li>
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
    const trigger = canvas.getByRole('button', { name: /Recursos/i });
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    const featured = within(document.body).getByText(/Novidade · v3.0/i);
    await expect(featured).toBeVisible();
  },
};
