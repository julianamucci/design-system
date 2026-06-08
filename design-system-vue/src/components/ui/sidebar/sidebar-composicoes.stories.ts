import type { Meta, StoryObj } from '@storybook/vue3';
import { within, expect } from 'storybook/test';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarInput,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard, Blocks, Palette, Settings, User,
  ChevronRight, Bell, Plus, MoreHorizontal, Search,
} from 'lucide-vue-next';

const meta = {
  title: 'UI/Sidebar/Composicoes',
  component: Sidebar,
  tags: ['layout'],
  parameters: {
    layout: 'fullscreen',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Composicoes avançadas da Sidebar: com grupos de navegação, com sub-menus, com badge e com campo de busca.',
      },
    },
  },
  decorators: [
    () => ({
      template: '<div class="min-h-[400px] flex w-full"><story /></div>',
    }),
  ],
} satisfies Meta<typeof Sidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Com grupos de navegação ──────────────────────────────────────────────────

export const WithNavGroups: Story = {
  name: 'Com grupos de navegação',
  parameters: {
    docs: {
      description: { story: 'Sidebar com múltiplos SidebarGroup separados por SidebarSeparator, cada grupo com label e ação.' },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('renderiza nav acessível com grupos', async () => {
      const nav = canvas.getByRole('navigation', { name: /navegação principal/i });
      await expect(nav).toBeInTheDocument();
    });
    await step('badge de notificações visível', async () => {
      const badges = canvas.getAllByText(/^\d+$/);
      await expect(badges.length).toBeGreaterThanOrEqual(1);
    });
  },
  render: () => ({
    components: {
      Sidebar, SidebarProvider, SidebarContent, SidebarHeader, SidebarFooter,
      SidebarGroup, SidebarGroupLabel, SidebarGroupAction, SidebarGroupContent,
      SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarMenuAction,
      SidebarMenuBadge, SidebarSeparator, SidebarInset, SidebarTrigger, SidebarRail,
      LayoutDashboard, Blocks, Palette, Settings, User, Bell, Plus, MoreHorizontal,
    },
    template: `
      <SidebarProvider>
        <nav aria-label="Navegação principal">
          <Sidebar collapsible="offcanvas">
            <SidebarHeader class="p-4 font-semibold text-sidebar-foreground">Design System</SidebarHeader>
            <SidebarContent>
              <!-- Grupo 1: Aplicação -->
              <SidebarGroup>
                <SidebarGroupLabel>Aplicação</SidebarGroupLabel>
                <SidebarGroupAction title="Adicionar item">
                  <Plus aria-hidden="true" />
                  <span class="sr-only">Adicionar item</span>
                </SidebarGroupAction>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton :isActive="true" tooltip="Dashboard" aria-current="page">
                        <LayoutDashboard aria-hidden="true" />
                        <span>Dashboard</span>
                      </SidebarMenuButton>
                      <SidebarMenuBadge>3</SidebarMenuBadge>
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

              <!-- Grupo 2: Conta -->
              <SidebarGroup>
                <SidebarGroupLabel>Conta</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton tooltip="Notificações">
                        <Bell aria-hidden="true" />
                        <span>Notificações</span>
                      </SidebarMenuButton>
                      <SidebarMenuBadge>12</SidebarMenuBadge>
                      <SidebarMenuAction title="Mais opções">
                        <MoreHorizontal aria-hidden="true" />
                        <span class="sr-only">Mais opções</span>
                      </SidebarMenuAction>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton tooltip="Configuracoes">
                        <Settings aria-hidden="true" />
                        <span>Configuracoes</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
            <SidebarFooter class="p-2">
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Perfil">
                    <User aria-hidden="true" />
                    <span>Perfil do Usuário</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarFooter>
            <SidebarRail />
          </Sidebar>
        </nav>
        <SidebarInset>
          <header class="flex h-12 items-center gap-2 px-4 border-b border-border">
            <SidebarTrigger class="lg:hidden" />
            <span class="text-sm text-muted-foreground">Com grupos e badges</span>
          </header>
          <main id="main-content" class="p-4">
            <p class="text-sm text-muted-foreground">Sidebar com múltiplos grupos de navegação, badges e ações.</p>
          </main>
        </SidebarInset>
      </SidebarProvider>
    `,
  }),
};

// ─── Com sub-menu ─────────────────────────────────────────────────────────────

export const WithSubMenu: Story = {
  name: 'Com sub-menu',
  parameters: {
    docs: {
      description: { story: 'Sidebar com SidebarMenuSub: itens aninhados com linha de referência visual.' },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('renderiza nav acessível com sub-menus', async () => {
      const nav = canvas.getByRole('navigation', { name: /navegação principal/i });
      await expect(nav).toBeInTheDocument();
    });
  },
  render: () => ({
    components: {
      Sidebar, SidebarProvider, SidebarContent, SidebarHeader,
      SidebarGroup, SidebarGroupLabel, SidebarGroupContent,
      SidebarMenu, SidebarMenuItem, SidebarMenuButton,
      SidebarMenuSub, SidebarMenuSubItem, SidebarMenuSubButton,
      SidebarInset, SidebarTrigger, SidebarRail,
      LayoutDashboard, Blocks, Palette, ChevronRight,
    },
    setup() {
      return { expanded: true };
    },
    template: `
      <SidebarProvider>
        <nav aria-label="Navegação principal">
          <Sidebar collapsible="offcanvas">
            <SidebarHeader class="p-4 font-semibold text-sidebar-foreground">Design System</SidebarHeader>
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel>Documentação</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton :isActive="true" tooltip="Dashboard" aria-current="page">
                        <LayoutDashboard aria-hidden="true" />
                        <span>Dashboard</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <!-- Item com sub-menu -->
                    <SidebarMenuItem>
                      <SidebarMenuButton tooltip="Componentes">
                        <Blocks aria-hidden="true" />
                        <span>Componentes</span>
                        <ChevronRight class="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" aria-hidden="true" />
                      </SidebarMenuButton>
                      <SidebarMenuSub>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton :isActive="false">
                            <span>Alert</span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton :isActive="false">
                            <span>Button</span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton :isActive="true">
                            <span>Sidebar</span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton :isActive="false">
                            <span>Card</span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      </SidebarMenuSub>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton tooltip="Tokens">
                        <Palette aria-hidden="true" />
                        <span>Tokens</span>
                        <ChevronRight class="ml-auto" aria-hidden="true" />
                      </SidebarMenuButton>
                      <SidebarMenuSub>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton>
                            <span>Cores</span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton>
                            <span>Tipografia</span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton>
                            <span>Espaçamento</span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      </SidebarMenuSub>
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
            <span class="text-sm text-muted-foreground">Com sub-menus</span>
          </header>
          <main id="main-content" class="p-4">
            <p class="text-sm text-muted-foreground">Sidebar com SidebarMenuSub para hierarquia de navegação aninhada.</p>
          </main>
        </SidebarInset>
      </SidebarProvider>
    `,
  }),
};

// ─── Com busca ────────────────────────────────────────────────────────────────

export const WithSearch: Story = {
  name: 'Com campo de busca',
  parameters: {
    docs: {
      description: { story: 'Sidebar com SidebarInput no header para filtrar navegação inline.' },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('renderiza nav acessível com campo de busca', async () => {
      const nav = canvas.getByRole('navigation', { name: /navegação principal/i });
      await expect(nav).toBeInTheDocument();
    });
    await step('campo de busca presente', async () => {
      const input = canvas.getByRole('textbox');
      await expect(input).toBeInTheDocument();
    });
  },
  render: () => ({
    components: {
      Sidebar, SidebarProvider, SidebarContent, SidebarHeader,
      SidebarGroup, SidebarGroupContent, SidebarMenu,
      SidebarMenuItem, SidebarMenuButton, SidebarInput,
      SidebarInset, SidebarTrigger, SidebarRail,
      LayoutDashboard, Blocks, Palette, Settings, User, Search,
    },
    template: `
      <SidebarProvider>
        <nav aria-label="Navegação principal">
          <Sidebar collapsible="offcanvas">
            <SidebarHeader class="p-2 gap-2">
              <span class="px-2 font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">Design System</span>
              <SidebarInput placeholder="Buscar..." />
            </SidebarHeader>
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton :isActive="true" tooltip="Dashboard" aria-current="page">
                        <LayoutDashboard aria-hidden="true" /><span>Dashboard</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton tooltip="Componentes">
                        <Blocks aria-hidden="true" /><span>Componentes</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton tooltip="Tokens">
                        <Palette aria-hidden="true" /><span>Tokens</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton tooltip="Configuracoes">
                        <Settings aria-hidden="true" /><span>Configuracoes</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton tooltip="Perfil">
                        <User aria-hidden="true" /><span>Perfil</span>
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
            <span class="text-sm text-muted-foreground">Com busca no header</span>
          </header>
          <main id="main-content" class="p-4">
            <p class="text-sm text-muted-foreground">SidebarInput no header para busca inline.</p>
          </main>
        </SidebarInset>
      </SidebarProvider>
    `,
  }),
};
