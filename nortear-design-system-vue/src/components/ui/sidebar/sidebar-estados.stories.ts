import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { userEvent, waitFor, within, expect } from 'storybook/test';
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
  title: 'UI/Sidebar/States',
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
      template: '<div class="nds-cluster nds-min-h-100 nds-w-full"><story /></div>',
    }),
  ],
} satisfies Meta<typeof Sidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Expandida (padrão) ───────────────────────────────────────────────────────

export const Expanded: Story = {
  name: 'Expanded',
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
            <SidebarHeader class="nds-p-4 nds-font-semibold nds-text-muted-foreground">Design System</SidebarHeader>
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
          <header class="nds-cluster nds-px-4 nds-py-2 nds-border-b" data-align="center" data-spacing="sm">
            <SidebarTrigger />
            <span class="nds-text-caption nds-text-muted-foreground nds-font-mono">data-state="expanded"</span>
          </header>
          <main id="main-content" class="nds-p-4">
            <p class="nds-text-body">Sidebar expandida.</p>
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
  name: 'Collapsed (icon)',
  parameters: {
    covers: ['functional.item4', 'functional.item7', 'visual.item2'],
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
            <SidebarHeader class="nds-p-2 nds-font-semibold nds-text-muted-foreground nds-overflow-hidden">
              <span class="nds-sidebar-hide-collapsed">Design System</span>
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
          <header class="nds-cluster nds-px-4 nds-py-2 nds-border-b" data-align="center" data-spacing="sm">
            <SidebarTrigger />
            <span class="nds-text-caption nds-text-muted-foreground nds-font-mono">collapsible="icon", data-state="collapsed"</span>
          </header>
          <main id="main-content" class="nds-p-4">
            <p class="nds-text-body">Sidebar no modo icon — apenas ícones visíveis com tooltip ao hover.</p>
          </main>
        </SidebarInset>
      </SidebarProvider>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const raiz = () => canvasElement.querySelector<HTMLElement>('[data-slot="sidebar"]')!;

    await step('A barra nasce recolhida em ícones', async () => {
      await expect(raiz().getAttribute('data-state')).toBe('collapsed');
      await expect(raiz().getAttribute('data-collapsible')).toBe('icon');
    });

    await step('O painel estreita para a largura de ícone', async () => {
      // Mede o pixel declarado, e não o atributo: a regra que estreita é
      // `[data-collapsible="icon"] .nds-sidebar-panel { width: … }`. Usa o
      // computado porque abaixo de 48rem o painel é `display: none`.
      const painel = raiz().querySelector<HTMLElement>('.nds-sidebar-panel')!;
      const emRem = parseFloat(getComputedStyle(raiz()).getPropertyValue('--sidebar-width-icon'));
      const px = emRem * parseFloat(getComputedStyle(document.documentElement).fontSize);
      await expect(Math.round(parseFloat(getComputedStyle(painel).width))).toBe(Math.round(px));
    });

    await step('O rótulo textual do cabeçalho some no modo ícone', async () => {
      const rotulo = canvasElement.querySelector<HTMLElement>('.nds-sidebar-hide-collapsed')!;
      await expect(getComputedStyle(rotulo).display).toBe('none');
    });

    await step('O ponteiro sobre o item abre o balão com o nome da seção', async () => {
      // Sem rótulo visível, o balão é o que resta para quem usa ponteiro — e
      // ele só pode aparecer enquanto a barra está recolhida. O timeout maior é
      // pelo atraso de abertura do tooltip, que é do componente e não do teste.
      const item = canvas.getByRole('button', { name: /dashboard/i });
      await userEvent.hover(item);
      await waitFor(
        async () => {
          const balao = document.querySelector<HTMLElement>('[data-slot="tooltip-content"]');
          await expect(balao).not.toBeNull();
          // O balão traz o rótulo DUAS vezes: o texto visível e, ao lado dele,
          // uma cópia visualmente escondida com role="tooltip" — é essa cópia
          // que o leitor de tela anuncia, e é uma forma da biblioteca headless,
          // não um defeito. Somar tudo em `textContent` daria "DashboardDashboard",
          // então cada nó é medido pelo papel que cumpre.
          const anunciado = balao!.querySelector<HTMLElement>('[role="tooltip"]')!;
          await expect(anunciado).not.toBeNull();
          await expect(anunciado.textContent?.trim()).toBe('Dashboard');
          const visivel = Array.from(balao!.childNodes)
            .filter(no => no !== anunciado)
            .map(no => no.textContent ?? '')
            .join('')
            .trim();
          await expect(visivel).toBe('Dashboard');
        },
        { timeout: 3000 },
      );
      // Devolve o DOM ao estado de entrada para o replay. Sair do item não
      // basta: entre gatilho e balão existe uma área de tolerância — é ela que
      // deixa o ponteiro percorrer o caminho até o balão sem que ele feche — e,
      // enquanto o ponteiro não reaparece fora dela, o balão continua de pé. O
      // fechamento é provocado como no uso real: levando o ponteiro ao conteúdo.
      await userEvent.unhover(item);
      await userEvent.hover(canvasElement.querySelector<HTMLElement>('#main-content')!);
      await waitFor(
        () => expect(document.querySelector('[data-slot="tooltip-content"]')).toBeNull(),
        { timeout: 3000 },
      );
    });
  },
};

// ─── Fixo (none) ──────────────────────────────────────────────────────────────

export const CollapsibleNone: Story = {
  name: 'Fixed (none)',
  parameters: {
    covers: ['functional.item5'],
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
            <SidebarHeader class="nds-p-4 nds-font-semibold nds-text-muted-foreground">Design System</SidebarHeader>
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
          <header class="nds-cluster nds-px-4 nds-py-2 nds-border-b" data-align="center" data-spacing="sm">
            <span class="nds-text-caption nds-text-muted-foreground nds-font-mono">collapsible="none" — sidebar sempre visível</span>
          </header>
          <main id="main-content" class="nds-p-4">
            <p class="nds-text-body">Sidebar fixa sem opção de recolhimento.</p>
          </main>
        </SidebarInset>
      </SidebarProvider>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Sem recolhimento não há estado de recolhimento', async () => {
      const raiz = canvasElement.querySelector<HTMLElement>('[data-slot="sidebar"]')!;
      await expect(raiz.classList.contains('nds-sidebar-static')).toBe(true);
      await expect(raiz.hasAttribute('data-state')).toBe(false);
      // Sem painel fixo, o conteúdo é a própria coluna — nada de reservar vão.
      await expect(canvasElement.querySelector('.nds-sidebar-gap-inner')).toBeNull();
    });

    await step('Não há gatilho de alternância na página', async () => {
      await expect(canvas.queryByRole('button', { name: /toggle sidebar/i })).toBeNull();
    });

    await step('A navegação continua inteira e acessível', async () => {
      await expect(canvas.getByRole('navigation', { name: /navegação principal/i })).toBeInTheDocument();
      await expect(canvas.getByRole('button', { name: /dashboard/i })).toHaveAttribute('aria-current', 'page');
    });
  },
};

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

export const LoadingSkeleton: Story = {
  parameters: {
    covers: ['functional.item9'],
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
            <SidebarHeader class="nds-p-4 nds-font-semibold nds-text-muted-foreground">Design System</SidebarHeader>
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
          <header class="nds-cluster nds-px-4 nds-py-2 nds-border-b" data-align="center" data-spacing="sm">
            <span class="nds-text-caption nds-text-muted-foreground nds-font-mono">SidebarMenuSkeleton showIcon=true</span>
          </header>
          <main id="main-content" class="nds-p-4">
            <p class="nds-text-body">Estado de carregamento com skeletons.</p>
          </main>
        </SidebarInset>
      </SidebarProvider>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('Cada item de menu vira um placeholder', async () => {
      const skeletons = canvasElement.querySelectorAll('[data-slot="sidebar-menu-skeleton"]');
      await expect(skeletons.length).toBe(5);
    });

    await step('showIcon monta o quadrado do ícone à esquerda do texto', async () => {
      const primeiro = canvasElement.querySelector<HTMLElement>(
        '[data-slot="sidebar-menu-skeleton"]',
      )!;
      const icone = primeiro.querySelector<HTMLElement>('.nds-sidebar-menu-skeleton-icon')!;
      const texto = primeiro.querySelector<HTMLElement>('.nds-sidebar-menu-skeleton-text')!;
      await expect(icone).not.toBeNull();
      await expect(icone.getBoundingClientRect().left).toBeLessThan(
        texto.getBoundingClientRect().left,
      );
    });
  },
};

// ─── Mobile (viewport simulada) ───────────────────────────────────────────────

/**
 * DÍVIDA DECLARADA: `functional.item3` pede a virada para o overlay em viewport
 * estreita. Nesta stack o corte vem de uma media query global, sem ponto de
 * injeção — o parâmetro `viewport` redimensiona o iframe no Storybook e no
 * Chromatic (é o que esta story fotografa), mas não no runner headless, onde
 * nenhum passo consegue forçar a virada. Por isso só o item visual é declarado.
 */
export const MobileOverlay: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    covers: ['visual.item5'],
    coversNotApplicable: {
      'functional.item3':
        'a virada para o overlay depende de media query global sem ponto de injeção nesta stack; nenhum passo a força de forma determinística',
    },
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
            <SidebarHeader class="nds-p-4 nds-font-semibold nds-text-muted-foreground">Design System</SidebarHeader>
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
          <header class="nds-cluster nds-px-4 nds-py-2 nds-border-b" data-align="center" data-spacing="sm">
            <SidebarTrigger />
            <span class="nds-text-body nds-font-medium">Mobile — clique no trigger</span>
          </header>
          <main id="main-content" class="nds-p-4">
            <p class="nds-text-body">Em mobile, a sidebar aparece como Sheet overlay.</p>
          </main>
        </SidebarInset>
      </SidebarProvider>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('A navegação e o gatilho existem em qualquer largura', async () => {
      // O que vale nas duas larguras: a barra tem nome de marco e há um único
      // controle de abertura. O resto do cenário é a foto do Chromatic.
      await expect(canvas.getByRole('navigation', { name: /navegação principal/i })).toBeInTheDocument();
      await expect(canvas.getByRole('button', { name: /toggle sidebar/i })).toBeInTheDocument();
    });
  },
};
