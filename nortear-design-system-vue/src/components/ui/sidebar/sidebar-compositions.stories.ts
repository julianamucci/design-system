import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { userEvent, within, expect } from 'storybook/test';
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
import {
  sidebarSearchSource,
  sidebarGroupsSource,
  sidebarSubmenuSource,
} from './sidebar.source';

const meta = {
  title: 'UI/Sidebar/Compositions',
  component: Sidebar,
  tags: ['layout'],
  parameters: {
    layout: 'fullscreen',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: sidebarGroupsSource },
      description: {
        component:
          'Composicoes avançadas da Sidebar: com grupos de navegação, com sub-menus, com badge e com campo de busca.',
      },
    },
  },
  decorators: [
    () => ({
      template: '<div class="nds-cluster nds-min-h-100 nds-w-full"><story /></div>',
    }),
  ],
} satisfies Meta<typeof Sidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Com grupos de navegação ──────────────────────────────────────────────────

export const WithNavGroups: Story = {
  name: 'With nav groups',
  parameters: {
    covers: ['accessibility.item6'],
    docs: {
      description: { story: 'Sidebar com múltiplos SidebarGroup separados por SidebarSeparator, cada grupo com label e ação.' },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Os grupos são separados por um separador', async () => {
      await expect(canvasElement.querySelectorAll('[data-slot="sidebar-group"]').length).toBe(2);
      await expect(canvasElement.querySelector('[data-slot="sidebar-separator"]')).not.toBeNull();
    });

    await step('As ações têm nome — o "+" e as reticências sozinhos não dizem nada', async () => {
      // O nome vem do <span class="nds-sr-only">, que existe justamente porque
      // o ícone é decorativo.
      const adicionar = canvas.getByRole('button', { name: 'Adicionar item' });
      await expect(adicionar).toHaveAttribute('data-slot', 'sidebar-group-action');
      const mais = canvas.getByRole('button', { name: 'Mais opções' });
      await expect(mais).toHaveAttribute('data-slot', 'sidebar-menu-action');
    });

    await step('O contador é texto de apoio, não o item de menu', async () => {
      const badges = canvasElement.querySelectorAll('[data-slot="sidebar-menu-badge"]');
      await expect(badges.length).toBe(2);
      await expect(Array.from(badges).map((b) => b.textContent?.trim())).toEqual(['3', '12']);
    });

    await step('O Tab alcança os itens e as ações — nenhuma parada sem nome', async () => {
      const primeiro = canvas.getByRole('button', { name: 'Adicionar item' });
      primeiro.focus();
      const alcancados: string[] = [];
      for (let i = 0; i < 5; i++) {
        await userEvent.tab();
        const ativo = document.activeElement as HTMLElement | null;
        if (!ativo) continue;
        // `aria-label` ANTES do texto: onde ele existe, é ele que vence no
        // cálculo do nome acessível.
        alcancados.push(ativo.getAttribute('aria-label') ?? ativo.textContent?.trim() ?? '');
      }
      await expect(alcancados).toContain('Dashboard');
      await expect(alcancados).not.toContain('');
      // Devolve o foco ao ponto de partida para o replay.
      primeiro.blur();
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
            <SidebarHeader class="nds-p-4 nds-font-semibold nds-text-muted-foreground">Design System</SidebarHeader>
            <SidebarContent>
              <!-- Grupo 1: Aplicação -->
              <SidebarGroup>
                <SidebarGroupLabel>Aplicação</SidebarGroupLabel>
                <SidebarGroupAction title="Adicionar item">
                  <Plus aria-hidden="true" />
                  <span class="nds-sr-only">Adicionar item</span>
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
                        <span class="nds-sr-only">Mais opções</span>
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
            <SidebarFooter class="nds-p-2">
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
          <header class="nds-cluster nds-px-4 nds-py-2 nds-border-b" data-align="center" data-spacing="sm">
            <SidebarTrigger class="nds-lg-hidden" />
            <span class="nds-text-body nds-text-muted-foreground">Com grupos e badges</span>
          </header>
          <main id="main-content" class="nds-p-4">
            <p class="nds-text-body">Sidebar com múltiplos grupos de navegação, badges e ações.</p>
          </main>
        </SidebarInset>
      </SidebarProvider>
    `,
  }),
};

// ─── Com sub-menu ─────────────────────────────────────────────────────────────

export const WithSubmenu: Story = {
  name: 'With submenu',
  parameters: {
    docs: {
      // A lista aninhada mora dentro do item pai, e o pai declara
      // `aria-expanded` — nada disso existe na composição do meta.
      source: { transform: sidebarSubmenuSource },
      description: { story: 'Sidebar com SidebarMenuSub: itens aninhados com linha de referência visual.' },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O submenu é uma lista aninhada de verdade', async () => {
      const subs = canvasElement.querySelectorAll<HTMLElement>('[data-slot="sidebar-menu-sub"]');
      await expect(subs.length).toBe(2);
      await expect(subs[0].tagName).toBe('UL');
      await expect(subs[0].closest('[data-slot="sidebar-menu-item"]')).not.toBeNull();
      await expect(subs[0].querySelectorAll('[data-slot="sidebar-menu-sub-item"]').length).toBe(4);
    });

    await step('O botão pai declara que o submenu está aberto', async () => {
      // Sem `aria-expanded` a chevron gira só para quem vê: quem ouve não
      // recebe aviso nenhum de que há um nível abaixo, nem de que ele está
      // aberto.
      await expect(canvas.getByRole('button', { name: /componentes/i }))
        .toHaveAttribute('aria-expanded', 'true');
    });

    await step('A navegação continua com nome de marco', async () => {
      await expect(canvas.getByRole('navigation', { name: /navegação principal/i })).toBeInTheDocument();
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
            <SidebarHeader class="nds-p-4 nds-font-semibold nds-text-muted-foreground">Design System</SidebarHeader>
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
                      <SidebarMenuButton tooltip="Componentes" aria-expanded="true">
                        <Blocks aria-hidden="true" />
                        <span>Componentes</span>
                        <!-- A classe nds-chevron já gira sob [aria-expanded="true"]:
                             a rotação sai do estado no DOM, não de classe condicional.
                             Sem crase aqui: este comentário mora dentro de um
                             template literal, e uma crase encerraria a string. -->
                        <ChevronRight class="nds-spacer-start nds-chevron" aria-hidden="true" />
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
                      <SidebarMenuButton tooltip="Tokens" aria-expanded="true">
                        <Palette aria-hidden="true" />
                        <span>Tokens</span>
                        <ChevronRight class="nds-spacer-start nds-chevron" aria-hidden="true" />
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
          <header class="nds-cluster nds-px-4 nds-py-2 nds-border-b" data-align="center" data-spacing="sm">
            <SidebarTrigger class="nds-lg-hidden" />
            <span class="nds-text-body nds-text-muted-foreground">Com sub-menus</span>
          </header>
          <main id="main-content" class="nds-p-4">
            <p class="nds-text-body">Sidebar com SidebarMenuSub para hierarquia de navegação aninhada.</p>
          </main>
        </SidebarInset>
      </SidebarProvider>
    `,
  }),
};

// ─── Com busca ────────────────────────────────────────────────────────────────

export const WithSearch: Story = {
  name: 'With search field',
  parameters: {
    docs: {
      // O campo de busca troca o cabeçalho inteiro, e leva `aria-label` porque
      // o placeholder some ao digitar.
      source: { transform: sidebarSearchSource },
      description: { story: 'Sidebar com SidebarInput no header para filtrar navegação inline.' },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('O campo de busca tem nome — o placeholder some ao digitar', async () => {
      const busca = canvas.getByRole('textbox', { name: 'Buscar na navegação' });
      await expect(busca).toHaveAttribute('data-slot', 'sidebar-input');
      await expect(busca.closest('[data-slot="sidebar-header"]')).not.toBeNull();
    });

    await step('A navegação continua com nome de marco', async () => {
      await expect(canvas.getByRole('navigation', { name: /navegação principal/i })).toBeInTheDocument();
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
            <SidebarHeader class="nds-p-2" data-spacing="sm">
              <span class="nds-px-2 nds-font-semibold nds-text-muted-foreground nds-sidebar-hide-collapsed">Design System</span>
              <SidebarInput placeholder="Buscar..." aria-label="Buscar na navegação" />
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
          <header class="nds-cluster nds-px-4 nds-py-2 nds-border-b" data-align="center" data-spacing="sm">
            <SidebarTrigger class="nds-lg-hidden" />
            <span class="nds-text-body nds-text-muted-foreground">Com busca no header</span>
          </header>
          <main id="main-content" class="nds-p-4">
            <p class="nds-text-body">SidebarInput no header para busca inline.</p>
          </main>
        </SidebarInset>
      </SidebarProvider>
    `,
  }),
};
