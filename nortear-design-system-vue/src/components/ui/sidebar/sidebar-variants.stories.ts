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
import {
  sidebarSideDireitoSource,
  sidebarVariantFloatingSource,
  sidebarVariantInsetSource,
  sidebarVariantSidebarSource,
} from './sidebar.source';

const meta = {
  title: 'UI/Sidebar/Variants',
  component: Sidebar,
  tags: ['layout'],
  parameters: {
    layout: 'fullscreen',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: sidebarVariantSidebarSource },
      description: {
        component:
          'Três variantes visuais da Sidebar: **sidebar** (padrão), **floating** e **inset**. Cada uma altera o posicionamento e a aparência do container.',
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
            <header class="nds-cluster nds-px-4 nds-py-2 nds-border-b" data-align="center" data-spacing="sm">
              <SidebarTrigger class="nds-lg-hidden" />
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

const rootOf = (el: HTMLElement) => el.querySelector<HTMLElement>('[data-slot="sidebar"]')!;

export const VariantSidebar: Story = {
  parameters: {
    docs: {
      description: { story: 'Sidebar padrão colada na borda da viewport. Empurra o conteúdo ao expandir (push mode).' },
    },
  },
  ...makeStory('sidebar'),
  play: async ({ canvasElement, step }) => {
    await step('A variante padrão não arredonda o painel interno', async () => {
      const root = rootOf(canvasElement);
      await expect(root.getAttribute('data-variant')).toBe('sidebar');
      const interno = root.querySelector<HTMLElement>('.nds-sidebar-inner')!;
      await expect(parseFloat(getComputedStyle(interno).borderTopLeftRadius)).toBe(0);
    });
  },
};

// ─── Variante: floating ───────────────────────────────────────────────────────

export const VariantFloating: Story = {
  parameters: {
    covers: ['functional.item8', 'visual.item3'],
    docs: {
      // A variante não vem de control nesta página: sem override, as três
      // stories mostrariam o snippet da padrão.
      source: { transform: sidebarVariantFloatingSource },
      description: { story: 'Sidebar com borda arredondada e sombra, flutuando sobre um pequeno padding. Não empurra o conteúdo.' },
    },
  },
  ...makeStory('floating'),
  play: async ({ canvasElement, step }) => {
    await step('floating ganha borda, cantos e sombra no painel interno', async () => {
      // Afirma o pixel, e não só o atributo: a regra é
      // `[data-variant="floating"] .nds-sidebar-inner`, e um atributo no lugar
      // errado passaria despercebido.
      const root = rootOf(canvasElement);
      await expect(root.getAttribute('data-variant')).toBe('floating');

      const interno = root.querySelector<HTMLElement>('.nds-sidebar-inner')!;
      const estilo = getComputedStyle(interno);
      await expect(parseFloat(estilo.borderTopLeftRadius)).toBeGreaterThan(0);
      await expect(parseFloat(estilo.borderTopWidth)).toBeGreaterThan(0);
      await expect(estilo.boxShadow).not.toBe('none');
    });
  },
};

// ─── Variante: inset ──────────────────────────────────────────────────────────

export const VariantInset: Story = {
  parameters: {
    covers: ['visual.item4'],
    docs: {
      // Idem: a variante é o assunto e nenhum control a descreve.
      source: { transform: sidebarVariantInsetSource },
      description: { story: 'Sidebar integrada ao layout com o conteúdo em container arredondado adjacente.' },
    },
  },
  ...makeStory('inset'),
  play: async ({ canvasElement, step }) => {
    await step('inset marca a variante que arredonda o conteúdo adjacente', async () => {
      const root = rootOf(canvasElement);
      await expect(root.getAttribute('data-variant')).toBe('inset');
      // A regra que arredonda o conteúdo é `[data-variant="inset"] ~ .nds-sidebar-inset`
      // — depende de a barra e o conteúdo serem irmãos, e é isso que se perde
      // primeiro quando alguém envolve um dos dois.
      await expect(canvasElement.querySelector('.nds-sidebar-inset')).not.toBeNull();
    });
  },
};

// ─── Side: right ─────────────────────────────────────────────────────────────

export const SideRight: Story = {
  parameters: {
    covers: ['visual.item6'],
    docs: {
      // Muda a ORDEM dos irmãos, não só o `side`: o conteúdo vem primeiro para
      // que a leitura e a tabulação não comecem pela navegação.
      source: { transform: sidebarSideDireitoSource },
      description: { story: 'Sidebar posicionada na direita. Use em painéis de detalhes ou contexto.' },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('A barra encosta na direita', async () => {
      const root = rootOf(canvasElement);
      await expect(root.getAttribute('data-side')).toBe('right');
      // Medida, não atributo: a regra que posiciona é
      // `[data-side="right"] .nds-sidebar-panel { right: 0 }`.
      const panel = root.querySelector<HTMLElement>('.nds-sidebar-panel')!;
      await expect(getComputedStyle(panel).right).toBe('0px');
    });

    await step('Trocar de lado não mexe na navegação', async () => {
      await expect(canvas.getByRole('navigation', { name: /navegação principal/i })).toBeInTheDocument();
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
