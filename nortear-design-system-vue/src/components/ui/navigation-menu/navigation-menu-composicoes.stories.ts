import type { Meta, StoryObj } from '@storybook/vue3-vite';
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
  title: 'UI/NavigationMenu/Compositions',
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

export const SimpleLink: Story = {
  parameters: {
    docs: { description: { story: 'NavigationMenuLink direto, sem Trigger nem Content — para itens sem hierarquia.' } },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout; min-height: 80px;" class="nds-cluster nds-w-full" data-justify="center">
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

export const WithDropdown: Story = {
  parameters: {
    docs: { description: { story: 'Item com Trigger + Content em lista vertical simples — caso típico de dropdown de produtos.' } },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout; min-height: 280px;" class="nds-cluster nds-w-full" data-justify="center">
        <NavigationMenu aria-label="Navegação principal" :delay-duration="80" default-value="produtos">
          <NavigationMenuList>
            <NavigationMenuItem><NavigationMenuLink href="#">Início</NavigationMenuLink></NavigationMenuItem>
            <NavigationMenuItem value="produtos">
              <NavigationMenuTrigger>Produtos</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul class="nds-grid" data-spacing="sm" style="width: 320px; padding: 0.75rem">
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
      <div style="contain: layout; min-height: 320px;" class="nds-cluster nds-w-full" data-justify="center">
        <NavigationMenu aria-label="Navegação principal" :delay-duration="80" default-value="solucoes">
          <NavigationMenuList>
            <NavigationMenuItem value="solucoes">
              <NavigationMenuTrigger>Soluções</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul class="nds-grid nds-p-4" data-spacing="sm" data-cols="2" style="width: 600px">
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

export const WithHighlightedCard: Story = {
  parameters: {
    docs: { description: { story: 'Mega-menu com card promocional à esquerda + lista de links à direita.' } },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout; min-height: 340px;" class="nds-cluster nds-w-full" data-justify="center">
        <NavigationMenu aria-label="Navegação principal" :delay-duration="80" default-value="recursos">
          <NavigationMenuList>
            <NavigationMenuItem value="recursos">
              <NavigationMenuTrigger>Recursos</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul class="nds-grid grid-cols-[.75fr_1fr] nds-p-4" data-spacing="sm" style="width: 600px">
                  <li class="row-span-3">
                    <NavigationMenuLink
                      href="#"
                      class="nds-stack from-muted/50 to-muted nds-w-full nds-rounded-md bg-gradient-to-b nds-p-6 no-underline outline-hidden focus:shadow-md" style="user-select: none; height: 100%" data-justify="end" 
                    >
                      <div class="nds-mt-4 nds-mb-2 nds-text-base nds-font-medium">Novidade · v3.0</div>
                      <p class="nds-text-body leading-tight">
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
