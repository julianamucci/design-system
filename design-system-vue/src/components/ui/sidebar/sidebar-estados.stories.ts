import type { Meta, StoryObj } from '@storybook/vue3';
import { userEvent, within, expect } from 'storybook/test';
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
  SidebarMenuSkeleton,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { LayoutDashboard, Blocks, Palette, Settings, User } from 'lucide-vue-next';

const meta = {
  title: 'UI/Sidebar/Estados',
  component: Sidebar,
  tags: ['layout'],
  parameters: {
    layout: 'fullscreen',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Estados da Sidebar: expandida (padrão), modo icon colapsado, offcanvas, fixo (none) e loading skeleton.',
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

// ─── Expandida (padrão) ───────────────────────────────────────────────────────

export const Expanded: Story = {
  name: 'Expandida',
  parameters: {
    docs: {
      description: { story: 'Estado padrão: sidebar visível em largura total (16rem). Labels e ícones exibidos. data-state="expanded"' },
    },
  },
  render: () => ({
    components: {
      Sidebar, SidebarProvider, SidebarContent, SidebarHeader, SidebarFooter,
      SidebarGroup, SidebarGroupLabel, SidebarGroupContent, SidebarMenu,
      SidebarMenuItem, SidebarMenuButton, SidebarInset, SidebarTrigger, SidebarRail,
      LayoutDashboard, Blocks, Palette, Settings, User,
    },
    template: `
      <SidebarProvider :default-open="true">
        <nav aria-label="Navegação principal">
          <Sidebar collapsible="offcanvas">
            <SidebarHeader class="p-4 font-semibold text-sidebar-foreground">Design System</SidebarHeader>
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel>Aplicação</SidebarGroupLabel>
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
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
            <SidebarRail />
          </Sidebar>
        </nav>
        <SidebarInset>
          <header class="flex h-12 items-center gap-2 px-4 border-b border-border">
            <SidebarTrigger />
            <span class="text-xs text-muted-foreground font-mono">data-state="expanded"</span>
          </header>
          <main id="main-content" class="p-4">
            <p class="text-sm text-muted-foreground">Sidebar expandida.</p>
          </main>
        </SidebarInset>
      </SidebarProvider>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('sidebar expandida renderiza nav acessível', async () => {
      const nav = canvas.getByRole('navigation', { name: /navegação principal/i });
      await expect(nav).toBeInTheDocument();
    });

    await step('item ativo tem aria-current="page"', async () => {
      const btn = canvas.getByRole('button', { name: /dashboard/i });
      await expect(btn).toHaveAttribute('aria-current', 'page');
    });
  },
};

// ─── Icon mode colapsado ──────────────────────────────────────────────────────

export const CollapsedIcon: Story = {
  name: 'Recolhido (icon)',
  parameters: {
    docs: {
      description: { story: 'collapsible="icon": sidebar reduz para 3rem. Apenas ícones visíveis; tooltips ao hover. data-state="collapsed"' },
    },
  },
  render: () => ({
    components: {
      Sidebar, SidebarProvider, SidebarContent, SidebarHeader,
      SidebarGroup, SidebarGroupContent, SidebarMenu,
      SidebarMenuItem, SidebarMenuButton, SidebarInset, SidebarTrigger, SidebarRail,
      LayoutDashboard, Blocks, Palette, Settings,
    },
    template: `
      <SidebarProvider :default-open="false">
        <nav aria-label="Navegação principal">
          <Sidebar collapsible="icon">
            <SidebarHeader class="p-2 font-semibold text-sidebar-foreground overflow-hidden">
              <span class="group-data-[collapsible=icon]:hidden">Design System</span>
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
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
            <SidebarRail />
          </Sidebar>
        </nav>
        <SidebarInset>
          <header class="flex h-12 items-center gap-2 px-4 border-b border-border">
            <SidebarTrigger />
            <span class="text-xs text-muted-foreground font-mono">collapsible="icon", data-state="collapsed"</span>
          </header>
          <main id="main-content" class="p-4">
            <p class="text-sm text-muted-foreground">Sidebar no modo icon — apenas ícones visíveis com tooltip ao hover.</p>
          </main>
        </SidebarInset>
      </SidebarProvider>
    `,
  }),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.firstElementChild).toBeTruthy();
  },
};

// ─── Fixo (none) ──────────────────────────────────────────────────────────────

export const CollapsibleNone: Story = {
  name: 'Fixo (none)',
  parameters: {
    docs: {
      description: { story: 'collapsible="none": sidebar sempre visível. Sem toggle. Sem data-state de collapsed.' },
    },
  },
  render: () => ({
    components: {
      Sidebar, SidebarProvider, SidebarContent, SidebarHeader,
      SidebarGroup, SidebarGroupContent, SidebarMenu,
      SidebarMenuItem, SidebarMenuButton, SidebarInset,
      LayoutDashboard, Blocks, Palette,
    },
    template: `
      <SidebarProvider>
        <nav aria-label="Navegação principal">
          <Sidebar collapsible="none">
            <SidebarHeader class="p-4 font-semibold text-sidebar-foreground">Design System</SidebarHeader>
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton :isActive="true" aria-current="page">
                        <LayoutDashboard aria-hidden="true" /><span>Dashboard</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton>
                        <Blocks aria-hidden="true" /><span>Componentes</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton>
                        <Palette aria-hidden="true" /><span>Tokens</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>
        </nav>
        <SidebarInset>
          <header class="flex h-12 items-center gap-2 px-4 border-b border-border">
            <span class="text-xs text-muted-foreground font-mono">collapsible="none" — sidebar sempre visível</span>
          </header>
          <main id="main-content" class="p-4">
            <p class="text-sm text-muted-foreground">Sidebar fixa sem opção de recolhimento.</p>
          </main>
        </SidebarInset>
      </SidebarProvider>
    `,
  }),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.firstElementChild).toBeTruthy();
  },
};

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

export const LoadingSkeleton: Story = {
  name: 'Loading Skeleton',
  parameters: {
    docs: {
      description: { story: 'SidebarMenuSkeleton com showIcon=true: placeholder de carregamento para itens de menu.' },
    },
  },
  render: () => ({
    components: {
      Sidebar, SidebarProvider, SidebarContent, SidebarHeader,
      SidebarGroup, SidebarGroupLabel, SidebarGroupContent, SidebarMenu,
      SidebarMenuItem, SidebarMenuSkeleton, SidebarInset,
    },
    template: `
      <SidebarProvider>
        <nav aria-label="Navegação principal">
          <Sidebar collapsible="offcanvas">
            <SidebarHeader class="p-4 font-semibold text-sidebar-foreground">Design System</SidebarHeader>
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel>Carregando...</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem v-for="i in 5" :key="i">
                      <SidebarMenuSkeleton :show-icon="true" />
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>
        </nav>
        <SidebarInset>
          <header class="flex h-12 items-center gap-2 px-4 border-b border-border">
            <span class="text-xs text-muted-foreground font-mono">SidebarMenuSkeleton showIcon=true</span>
          </header>
          <main id="main-content" class="p-4">
            <p class="text-sm text-muted-foreground">Estado de carregamento com skeletons.</p>
          </main>
        </SidebarInset>
      </SidebarProvider>
    `,
  }),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.firstElementChild).toBeTruthy();
  },
};

// ─── Mobile (viewport simulada) ───────────────────────────────────────────────

export const MobileOverlay: Story = {
  name: 'Mobile (overlay)',
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    docs: {
      description: { story: 'Em viewport mobile, a Sidebar é renderizada como Sheet overlay (18rem). Abre via SidebarTrigger.' },
    },
  },
  render: () => ({
    components: {
      Sidebar, SidebarProvider, SidebarContent, SidebarHeader,
      SidebarGroup, SidebarGroupContent, SidebarMenu,
      SidebarMenuItem, SidebarMenuButton, SidebarInset, SidebarTrigger,
      LayoutDashboard, Blocks, Palette,
    },
    template: `
      <SidebarProvider>
        <nav aria-label="Navegação principal">
          <Sidebar collapsible="offcanvas">
            <SidebarHeader class="p-4 font-semibold text-sidebar-foreground">Design System</SidebarHeader>
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton :isActive="true" aria-current="page">
                        <LayoutDashboard aria-hidden="true" /><span>Dashboard</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton>
                        <Blocks aria-hidden="true" /><span>Componentes</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton>
                        <Palette aria-hidden="true" /><span>Tokens</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>
        </nav>
        <SidebarInset>
          <header class="flex h-12 items-center gap-2 px-4 border-b border-border">
            <SidebarTrigger />
            <span class="text-sm font-medium">Mobile — clique no trigger</span>
          </header>
          <main id="main-content" class="p-4">
            <p class="text-sm text-muted-foreground">Em mobile, a sidebar aparece como Sheet overlay.</p>
          </main>
        </SidebarInset>
      </SidebarProvider>
    `,
  }),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.firstElementChild).toBeTruthy();
  },
};
