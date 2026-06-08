/** @jsxImportSource react */
import type { Meta, StoryObj } from '@storybook/vue3';
import { fn, userEvent, within, expect } from 'storybook/test';
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
      template: '<div class="min-h-[400px] flex w-full"><story /></div>',
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
            <SidebarHeader class="p-4 font-semibold text-sidebar-foreground">Design System</SidebarHeader>
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
          <header class="flex h-12 items-center gap-2 px-4 border-b border-border">
            <SidebarTrigger class="lg:hidden" />
            <span class="text-sm text-muted-foreground">Conteúdo principal</span>
          </header>
          <main id="main-content" class="p-4">
            <p class="text-sm text-muted-foreground">Use os controles para alterar variant, collapsible e side.</p>
          </main>
        </SidebarInset>
      </SidebarProvider>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('sidebar renderiza com navegação acessível', async () => {
      const nav = canvas.getByRole('navigation', { name: /navegação principal/i });
      await expect(nav).toBeInTheDocument();
    });

    await step('item ativo tem aria-current="page"', async () => {
      const activeBtn = canvas.getByRole('button', { name: /dashboard/i });
      await expect(activeBtn).toHaveAttribute('aria-current', 'page');
    });
  },
};
