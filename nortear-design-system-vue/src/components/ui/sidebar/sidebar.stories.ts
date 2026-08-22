/** @jsxImportSource react */
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { userEvent, waitFor, within, expect } from 'storybook/test';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import SidebarDocs from '@/components/docs/SidebarDocs.vue';
import { sidebarPlaygroundSource } from './sidebar.source';

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

/** Props da barra mais o ponto de virada, que pertence ao Provider. */
interface SidebarPlaygroundArgs {
  side?: 'left' | 'right';
  variant?: 'sidebar' | 'floating' | 'inset';
  collapsible?: 'offcanvas' | 'icon' | 'none';
  mobileQuery?: string;
}

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
      source: { transform: sidebarPlaygroundSource },
    },
  },
  argTypes: {
    side: {
      control: 'select',
      options: ['left', 'right'],
      description: 'Posição da sidebar na viewport.',
      table: { type: { summary: `'left' | 'right'` }, defaultValue: { summary: 'left' } },
    },
    variant: {
      control: 'select',
      options: ['sidebar', 'floating', 'inset'],
      description: 'Estilo visual da sidebar.',
      table: { type: { summary: `'sidebar' | 'floating' | 'inset'` }, defaultValue: { summary: 'sidebar' } },
    },
    collapsible: {
      control: 'select',
      options: ['offcanvas', 'icon', 'none'],
      description: 'Comportamento ao recolher.',
      table: { type: { summary: `'offcanvas' | 'icon' | 'none'` }, defaultValue: { summary: 'offcanvas' } },
    },
    mobileQuery: {
      control: 'text',
      description:
        'Ponto de virada entre coluna e gaveta sobreposta. Uma consulta sempre verdadeira, como (min-width: 0px), força a gaveta em qualquer largura.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '(max-width: 767px)' } },
    },
  },
  args: {
    side: 'left',
    variant: 'sidebar',
    collapsible: 'offcanvas',
    mobileQuery: '(max-width: 767px)',
  },
  decorators: [
    () => ({
      template: '<div class="nds-cluster nds-min-h-100 nds-w-full"><story /></div>',
    }),
  ],
  // O tipo é o do andaime, e não `typeof Sidebar`: `mobileQuery` é prop do
  // Provider, não da barra, e a aba API Reference precisa dela declarada.
} satisfies Meta<SidebarPlaygroundArgs>;

export default meta;
// Tipado pelo andaime, e não por `typeof meta`: a inferência a partir de
// `component` só enxerga as props da barra, e `mobileQuery` é do Provider.
type Story = StoryObj<SidebarPlaygroundArgs>;

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
    mobileQuery: '(max-width: 767px)',
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
      <SidebarProvider
        :key="args.collapsible + args.variant + args.side + args.mobileQuery"
        :mobile-query="args.mobileQuery"
      >
        <nav aria-label="Navegação principal">
          <!-- Props explícitas, e não v-bind de args inteiro: a consulta de
               mídia é do Provider, e por queda de atributos ela viraria um
               atributo desconhecido no painel da barra. -->
          <Sidebar :side="args.side" :variant="args.variant" :collapsible="args.collapsible">
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
    const gatilho = () => canvas.getByRole('button', { name: /alternar barra lateral/i });

    await step('A navegação tem nome acessível', async () => {
      // Sem nome no <nav>, a barra é só "navegação" na lista de marcos do
      // leitor de tela — indistinguível de qualquer outra da página.
      await expect(canvas.getByRole('navigation', { name: /navegação principal/i })).toBeInTheDocument();
    });

    await step('O item ativo é anunciado como página atual', async () => {
      // `data-active` é para o CSS; quem não vê a cor precisa do aria-current.
      const active = canvas.getByRole('button', { name: /dashboard/i });
      await expect(active).toHaveAttribute('aria-current', 'page');
      await expect(active).toHaveAttribute('data-active', 'true');
    });

    await step('O ícone do item não é lido pelo leitor de tela', async () => {
      const icone = canvasElement.querySelector<SVGElement>(
        '[data-slot="sidebar-menu-button"] svg',
      )!;
      await expect(icone.getAttribute('aria-hidden')).toBe('true');
    });

    await step('O gatilho tem nome acessível, e em português', async () => {
      // Nome EXATO, e não presença: o gatilho é só um ícone, e o nome dele é a
      // única coisa que quem usa leitor de tela recebe. Enquanto o texto era
      // "Toggle Sidebar", nenhuma asserção reprovava.
      await expect(gatilho()).toHaveAccessibleName('Alternar barra lateral');
      // A faixa repete a ação com o ponteiro, e a dica dela é o mesmo texto.
      const faixa = canvasElement.querySelector<HTMLButtonElement>('[data-slot="sidebar-rail"]')!;
      await expect(faixa.title).toBe('Alternar barra lateral');
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
