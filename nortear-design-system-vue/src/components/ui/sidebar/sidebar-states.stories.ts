import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { userEvent, waitFor, within, expect } from 'storybook/test';
import { waitForPortal } from '@/lib/wait-for-portal';
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
import {
  sidebarLoadingSource,
  sidebarExpandidaSource,
  sidebarFixaSource,
  sidebarGavetaMovelSource,
  sidebarRecolhidaIconSource,
} from './sidebar.source';

const meta = {
  title: 'UI/Sidebar/States',
  component: Sidebar,
  tags: ['layout'],
  parameters: {
    layout: 'fullscreen',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: sidebarExpandidaSource },
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
      // O par é `collapsible="icon"` na barra com `:default-open="false"` no
      // provider — o meta mostra a barra aberta e sem modo de ícone.
      source: { transform: sidebarRecolhidaIconSource },
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
          const visible = Array.from(balao!.childNodes)
            .filter(no => no !== anunciado)
            .map(no => no.textContent ?? '')
            .join('')
            .trim();
          await expect(visible).toBe('Dashboard');
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
      // A ausência do gatilho e da faixa é deliberada: sem recolhimento, os
      // dois seriam controles que não fazem nada.
      source: { transform: sidebarFixaSource },
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
      await expect(canvas.queryByRole('button', { name: /alternar barra lateral/i })).toBeNull();
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
      // O item de menu dá lugar ao placeholder — é outra composição, não outro
      // valor de prop.
      source: { transform: sidebarLoadingSource },
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
 * A virada para a gaveta não depende da largura real da janela: a consulta de
 * mídia entra por `mobile-query`, e aqui ela é sempre verdadeira. É o que torna
 * o caminho móvel exercitável no runner headless, onde ninguém redimensiona o
 * navegador. O `viewport` continua servindo à foto do Chromatic.
 */
export const MobileOverlay: Story = {
  name: 'Mobile (gaveta sobreposta)',
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    covers: ['functional.item3', 'visual.item5'],
    docs: {
      // `mobile-query` é do provider e é o que força a gaveta; sem ela o
      // snippet do meta ensinaria a coluna, que é o caminho oposto.
      source: { transform: sidebarGavetaMovelSource },
      description: { story: 'Em largura de telefone a Sidebar sai do fluxo e vira gaveta sobreposta (18rem), aberta pelo SidebarTrigger e fechada por Escape, que devolve o foco ao gatilho.' },
    },
  },
  render: () => ({
    components: {
      Sidebar, SidebarProvider, SidebarContent, SidebarHeader,
      SidebarGroup, SidebarGroupContent, SidebarMenu,
      SidebarMenuItem, SidebarMenuButton, SidebarInset, SidebarTrigger,
      LayoutDashboard, Blocks, Palette,
    },
    setup() {
      // Marca de quem compõe: só existe para o passo que prova que a classe
      // chega ao painel nas duas larguras. Vem daqui, e não escrita como
      // atributo literal no template, porque uma classe literal fora do
      // vocabulário `nds-*` é resíduo de migração aos olhos do auditor — e
      // esta não é: é o dado do teste.
      return { marcaDoConsumidor: 'story-sidebar-marca' };
    },
    template: `
      <SidebarProvider mobile-query="(min-width: 0px)">
        <nav aria-label="Navegação principal">
          <Sidebar collapsible="offcanvas" :class="marcaDoConsumidor">
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
    // A gaveta é levada para fora do canvas por um portal: quem procura por ela
    // dentro de `canvasElement` não acha nada.
    const corpo = within(document.body);
    const gaveta = () => document.querySelector<HTMLElement>('[data-slot="sidebar"][data-mobile="true"]');
    // Guardado antes de qualquer abertura: com a gaveta aberta o resto da página
    // fica `aria-hidden`, e o gatilho deixa de ser alcançável por papel.
    const gatilho = canvas.getByRole('button', { name: /alternar barra lateral/i });

    await step('Precondição: a gaveta começa fechada', async () => {
      // O replay do painel Interactions reexecuta os passos sobre o DOM que
      // ficou. Fechar antes de medir é o que separa "abriu" de "já estava".
      if (gaveta()) {
        await userEvent.keyboard('{Escape}');
        await waitFor(() => expect(gaveta()).toBeNull());
      }
    });

    await step('Fechada, não há diálogo nem coluna ocupando o fluxo', async () => {
      await expect(corpo.queryByRole('dialog')).toBeNull();
      // Prova que o ramo móvel é o ativo: o ramo de coluna monta o vão que
      // reserva a largura e o painel fixo, e nenhum dos dois existe aqui.
      // Medido por atributo, e não por papel, porque um contêiner escondido
      // sai da árvore de acessibilidade e some das consultas por papel — o que
      // faria o passo passar mesmo com a coluna montada.
      await expect(canvasElement.querySelector('[data-slot="sidebar-gap"]')).toBeNull();
      await expect(canvasElement.querySelector('[data-slot="sidebar-container"]')).toBeNull();
      // E o marco de navegação continua na página, ainda que vazio: quem lê a
      // estrutura não perde a referência enquanto a gaveta está fechada.
      await expect(canvas.getByRole('navigation', { name: /navegação principal/i })).toBeInTheDocument();
    });

    await step('O gatilho abre um diálogo modal, com nome e com a navegação dentro', async () => {
      await userEvent.click(gatilho);
      // `findByRole` já espera a animação de entrada — sem tempo fixo.
      // Nome em português por padrão: era "Sidebar", cravado no componente.
      const painel = await corpo.findByRole('dialog', { name: /barra lateral/i });
      await expect(painel).toHaveAttribute('aria-modal', 'true');
      const dentro = within(painel);
      await expect(dentro.getByRole('button', { name: /dashboard/i })).toBeInTheDocument();
      await expect(dentro.getByRole('button', { name: /componentes/i })).toBeInTheDocument();
      await expect(dentro.getByRole('button', { name: /tokens/i })).toBeInTheDocument();
      // Um item, uma vez. Se os dois ramos montassem ao mesmo tempo, o leitor
      // de tela anunciaria a navegação inteira em dobro — e a consulta por
      // papel no documento todo é justamente o que enxerga isso.
      await expect(corpo.getAllByRole('button', { name: /dashboard/i })).toHaveLength(1);
    });

    await step('A classe de quem compõe chega ao painel da gaveta', async () => {
      // Na coluna ela pousa em `.nds-sidebar-panel`. Se sumisse aqui, o estilo
      // de quem compõe existiria numa largura e evaporaria na outra — e em
      // silêncio, que é o pior modo de falhar.
      const painel = gaveta()!;
      await expect(painel).toHaveClass('nds-sidebar-mobile');
      await expect(painel).toHaveClass('story-sidebar-marca');
    });

    await step('O foco entra no painel', async () => {
      const painel = gaveta()!;
      await waitFor(() => expect(painel.contains(document.activeElement)).toBe(true));
    });

    await step('Escape fecha a gaveta e devolve o foco ao gatilho', async () => {
      // Devolver o foco é o que decide se quem navega por teclado continua de
      // onde estava ou volta ao começo da página.
      await userEvent.keyboard('{Escape}');
      await waitFor(() => expect(gaveta()).toBeNull());
      await waitFor(() => expect(document.activeElement).toBe(gatilho));
    });

    await step('O atalho de teclado também alterna a gaveta', async () => {
      await userEvent.keyboard('{Control>}b{/Control}');
      await waitFor(() => expect(gaveta()).not.toBeNull());
      await userEvent.keyboard('{Control>}b{/Control}');
      await waitFor(() => expect(gaveta()).toBeNull());
    });

    await step('Termina ABERTA: é este o estado que a foto registra', async () => {
      // `visual.item5` promete "gaveta sobreposta ABERTA", e o Chromatic
      // fotografa o estado final da play. Enquanto ela terminava fechada, o
      // item estava coberto no papel e em foto nenhuma.
      //
      // O replay continua honesto: o primeiro passo fecha o que encontrar
      // aberto, e os pares abrir/fechar acima já provaram que os cliques
      // acontecem NESTA rodada. Este passo prova só o estado final.
      await userEvent.click(gatilho);
      // `waitForPortal` gateia na opacidade computada: `toBeVisible()` só
      // reprova em opacidade exatamente 0, e a gaveta entra com animação.
      const painel = await waitForPortal('dialog', { name: /barra lateral/i });
      await expect(painel).toBeVisible();
      await expect(painel).toBe(gaveta());
    });
  },
};
