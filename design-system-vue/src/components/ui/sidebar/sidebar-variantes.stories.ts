import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, expect } from 'storybook/test';
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
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { LayoutDashboard, Blocks, Palette, Settings, User } from 'lucide-vue-next';

const meta = {
  title: 'UI/Sidebar/Variantes',
  component: Sidebar,
  tags: ['layout'],
  parameters: {
    layout: 'fullscreen',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Três variantes visuais da Sidebar: **sidebar** (padrão), **floating** e **inset**. Cada uma altera o posicionamento e a aparência do container.',
      },
    },
  },
  decorators: [
    () => ({
      template: '<div class="nds-cluster min-h-[400px] nds-w-full"><story /></div>',
    }),
  ],
} satisfies Meta<typeof Sidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Helper template ──────────────────────────────────────────────────────────

function makeStory(variant: 'sidebar' | 'floating' | 'inset'): Story {
  return {
    render: () => ({
      components: {
        Sidebar, SidebarProvider, SidebarContent, SidebarHeader, SidebarFooter,
        SidebarGroup, SidebarGroupLabel, SidebarGroupContent, SidebarMenu,
        SidebarMenuItem, SidebarMenuButton, SidebarInset, SidebarTrigger, SidebarRail,
        LayoutDashboard, Blocks, Palette, Settings, User,
      },
      setup() {
        return { variant };
      },
      template: `
        <SidebarProvider>
          <nav aria-label="Navegação principal">
            <Sidebar :variant="variant" collapsible="offcanvas" side="left">
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
                      <span>Perfil</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarFooter>
              <SidebarRail />
            </Sidebar>
          </nav>
          <SidebarInset>
            <header class="nds-cluster nds-px-4 nds-border-b" data-align="center" data-spacing="sm" style="height: 3rem">
              <SidebarTrigger class="lg:hidden" />
              <span class="nds-text-caption nds-text-muted-foreground nds-font-mono">variant="{{ variant }}"</span>
            </header>
            <main id="main-content" class="nds-p-4">
              <p class="nds-text-body">Conteúdo principal adjacente à sidebar.</p>
            </main>
          </SidebarInset>
        </SidebarProvider>
      `,
    }),
  };
}

// ─── Variante: sidebar (padrão) ───────────────────────────────────────────────

export const VariantSidebar: Story = {
  name: 'Variant: sidebar',
  parameters: {
    docs: {
      description: { story: 'Sidebar padrão colada na borda da viewport. Empurra o conteúdo ao expandir (push mode).' },
    },
  },
  ...makeStory('sidebar'),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('sidebar variant=sidebar renderiza nav acessível', async () => {
      const nav = canvas.getByRole('navigation', { name: /navegação principal/i });
      await expect(nav).toBeInTheDocument();
    });
  },
};

// ─── Variante: floating ───────────────────────────────────────────────────────

export const VariantFloating: Story = {
  name: 'Variant: floating',
  parameters: {
    docs: {
      description: { story: 'Sidebar com borda arredondada e sombra, flutuando sobre um pequeno padding. Não empurra o conteúdo.' },
    },
  },
  ...makeStory('floating'),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('sidebar variant=floating renderiza nav acessível', async () => {
      const nav = canvas.getByRole('navigation', { name: /navegação principal/i });
      await expect(nav).toBeInTheDocument();
    });
  },
};

// ─── Variante: inset ──────────────────────────────────────────────────────────

export const VariantInset: Story = {
  name: 'Variant: inset',
  parameters: {
    docs: {
      description: { story: 'Sidebar integrada ao layout com o conteúdo em container arredondado adjacente.' },
    },
  },
  ...makeStory('inset'),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('sidebar variant=inset renderiza nav acessível', async () => {
      const nav = canvas.getByRole('navigation', { name: /navegação principal/i });
      await expect(nav).toBeInTheDocument();
    });
  },
};

// ─── Side: right ─────────────────────────────────────────────────────────────

export const SideRight: Story = {
  name: 'Side: right',
  parameters: {
    docs: {
      description: { story: 'Sidebar posicionada na direita. Use em painéis de detalhes ou contexto.' },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('sidebar side=right renderiza nav acessível', async () => {
      const nav = canvas.getByRole('navigation', { name: /navegação principal/i });
      await expect(nav).toBeInTheDocument();
    });
  },
  render: () => ({
    components: {
      Sidebar, SidebarProvider, SidebarContent, SidebarHeader,
      SidebarGroup, SidebarGroupContent, SidebarMenu,
      SidebarMenuItem, SidebarMenuButton, SidebarInset, SidebarRail,
      Settings, User,
    },
    template: `
      <SidebarProvider>
        <SidebarInset>
          <main id="main-content" class="nds-p-4">
            <p class="nds-text-body">Conteúdo principal à esquerda.</p>
          </main>
        </SidebarInset>
        <nav aria-label="Navegação principal">
          <Sidebar side="right" variant="sidebar" collapsible="offcanvas">
            <SidebarHeader class="nds-p-4 nds-font-semibold nds-text-muted-foreground">Detalhes</SidebarHeader>
            <SidebarContent>
              <SidebarGroup>
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
      </SidebarProvider>
    `,
  }),
};
