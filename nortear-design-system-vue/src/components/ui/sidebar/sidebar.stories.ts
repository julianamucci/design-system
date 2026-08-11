/** @jsxImportSource react */
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { userEvent, waitFor, within, expect } from 'storybook/test';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import SidebarDocs from '@/components/docs/SidebarDocs.vue';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Blocks,
  Palette,
  Settings,
  User,
} from 'lucide-vue-next';

const meta = {
  title: 'UI/Sidebar',
  component: Sidebar,
  tags: ['autodocs', 'layout'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Navegação principal persistente da aplicação com suporte a recolhimento, modo flutuante e overlay em mobile.',
      },
      page: withAutoDocsTab(SidebarDocs),
    },
  },
  argTypes: {
    side: {
      control: 'select',
      options: ['left', 'right'],
      description: 'Posição da sidebar na viewport.',
      table: { defaultValue: { summary: 'left' } },
    },
    variant: {
      control: 'select',
      options: ['sidebar', 'floating', 'inset'],
      description: 'Estilo visual da sidebar.',
      table: { defaultValue: { summary: 'sidebar' } },
    },
    collapsible: {
      control: 'select',
      options: ['offcanvas', 'icon', 'none'],
      description: 'Comportamento ao recolher.',
      table: { defaultValue: { summary: 'offcanvas' } },
    },
  },
  args: {
    side: 'left',
    variant: 'sidebar',
    collapsible: 'offcanvas',
  },
  decorators: [
    () => ({
      template: '<div class="nds-cluster nds-min-h-100 nds-w-full"><story /></div>',
    }),
  ],
} satisfies Meta<typeof Sidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', isActive: true },
  { icon: Blocks,          label: 'Componentes', isActive: false },
  { icon: Palette,         label: 'Tokens', isActive: false },
  { icon: Settings,        label: 'Configuracoes', isActive: false },
  { icon: User,            label: 'Perfil', isActive: false },
];

export const Playground: Story = {
  args: {
    side: 'left',
    variant: 'sidebar',
    collapsible: 'offcanvas',
  },
  parameters: {
    covers: [
      'functional.item1', 'functional.item2', 'functional.item6',
      'accessibility.item1', 'accessibility.item2', 'accessibility.item3',
      'accessibility.item4', 'accessibility.item5',
      'visual.item1',
    ],
  },
  render: (args) => ({
    components: {
      Sidebar, SidebarProvider, SidebarContent, SidebarHeader, SidebarFooter,
      SidebarGroup, SidebarGroupLabel, SidebarGroupContent, SidebarMenu,
      SidebarMenuItem, SidebarMenuButton, SidebarInset, SidebarTrigger, SidebarRail,
      SidebarSeparator,
      LayoutDashboard, Blocks, Palette, Settings, User,
    },
    setup() {
      return { args };
    },
    template: `
      <SidebarProvider :key="args.collapsible + args.variant + args.side">
        <nav aria-label="Navegação principal">
          <Sidebar v-bind="args">
            <SidebarHeader class="nds-p-4 nds-font-semibold nds-text-muted-foreground">Design System</SidebarHeader>
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel>Aplicação</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton :isActive="true" tooltip="Dashboard" aria-current="page">
                        <LayoutDashboard aria-hidden="true" />
                        <span>Dashboard</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton tooltip="Componentes">
                        <Blocks aria-hidden="true" />
                        <span>Componentes</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton tooltip="Tokens">
                        <Palette aria-hidden="true" />
                        <span>Tokens</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
              <SidebarSeparator />
              <SidebarGroup>
                <SidebarGroupLabel>Conta</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton tooltip="Configuracoes">
                        <Settings aria-hidden="true" />
                        <span>Configuracoes</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton tooltip="Perfil">
                        <User aria-hidden="true" />
                        <span>Perfil</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
            <SidebarRail />
          </Sidebar>
        </nav>
        <SidebarInset>
          <header class="nds-cluster nds-px-4 nds-py-2 nds-border-b" data-align="center" data-spacing="sm">
            <SidebarTrigger />
            <span class="nds-text-body nds-text-muted-foreground">Conteúdo principal</span>
          </header>
          <main id="main-content" class="nds-p-4">
            <p class="nds-text-body">Use os controles para alterar variant, collapsible e side.</p>
          </main>
        </SidebarInset>
      </SidebarProvider>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const raiz = () => canvasElement.querySelector<HTMLElement>('[data-slot="sidebar"]')!;
    const gatilho = () => canvas.getByRole('button', { name: /toggle sidebar/i });

    await step('A navegação tem nome acessível', async () => {
      // Sem nome no <nav>, a barra é só "navegação" na lista de marcos do
      // leitor de tela — indistinguível de qualquer outra da página.
      await expect(canvas.getByRole('navigation', { name: /navegação principal/i })).toBeInTheDocument();
    });

    await step('O item ativo é anunciado como página atual', async () => {
      // `data-active` é para o CSS; quem não vê a cor precisa do aria-current.
      const ativo = canvas.getByRole('button', { name: /dashboard/i });
      await expect(ativo).toHaveAttribute('aria-current', 'page');
      await expect(ativo).toHaveAttribute('data-active', 'true');
    });

    await step('O ícone do item não é lido pelo leitor de tela', async () => {
      const icone = canvasElement.querySelector<SVGElement>(
        '[data-slot="sidebar-menu-button"] svg',
      )!;
      await expect(icone.getAttribute('aria-hidden')).toBe('true');
    });

    await step('O gatilho tem nome acessível', async () => {
      await expect(gatilho()).toBeInTheDocument();
    });

    await step('O gatilho alterna o estado — e volta', async () => {
      // Par idempotente: o painel Interactions reexecuta a play no mesmo DOM,
      // e uma única inversão faria a segunda rodada afirmar o oposto.
      const antes = raiz().getAttribute('data-state');
      await userEvent.click(gatilho());
      await waitFor(() => expect(raiz().getAttribute('data-state')).not.toBe(antes));
      await userEvent.click(gatilho());
      await waitFor(() => expect(raiz().getAttribute('data-state')).toBe(antes));
    });

    await step('Ctrl+B alterna de qualquer lugar da página', async () => {
      const antes = raiz().getAttribute('data-state');
      await userEvent.keyboard('{Control>}b{/Control}');
      await waitFor(() => expect(raiz().getAttribute('data-state')).not.toBe(antes));
      await userEvent.keyboard('{Control>}b{/Control}');
      await waitFor(() => expect(raiz().getAttribute('data-state')).toBe(antes));
    });
  },
};
