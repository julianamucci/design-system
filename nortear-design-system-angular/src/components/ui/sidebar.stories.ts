import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, userEvent, within } from 'storybook/test';
import { NDS_SIDEBAR } from './sidebar';
import { NdsButtonIcon } from './button';
import { NdsSidebarDocs } from '@/components/docs/SidebarDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { sidebarPlaygroundSource, type SidebarArgs } from './sidebar.source';

const meta: Meta<SidebarArgs> = {
  title: 'Primitives/Layout/Sidebar',
  tags: ['layout', 'autodocs'],
  decorators: [moduleMetadata({ imports: [...NDS_SIDEBAR, NdsButtonIcon] })],
  parameters: {
    layout: 'fullscreen',
    docs: { page: withAutoDocsTab(NdsSidebarDocs) },
  },
  argTypes: {
    side: {
      control: 'inline-radio',
      options: ['left', 'right'],
      description: 'Lado da tela.',
      table: { type: { summary: `'left' | 'right'` }, defaultValue: { summary: `'left'` } },
    },
    variant: {
      control: 'inline-radio',
      options: ['sidebar', 'floating', 'inset'],
      description: 'Tratamento visual do painel.',
      table: {
        type: { summary: `'sidebar' | 'floating' | 'inset'` },
        defaultValue: { summary: `'sidebar'` },
      },
    },
    collapsible: {
      control: 'inline-radio',
      options: ['offcanvas', 'icon', 'none'],
      description: 'Como a sidebar recolhe.',
      table: {
        type: { summary: `'offcanvas' | 'icon' | 'none'` },
        defaultValue: { summary: `'offcanvas'` },
      },
    },
    defaultOpen: {
      control: 'boolean',
      description: 'Estado inicial.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    // DOCUMENTAÇÃO, e não controle: aqui o ponto de virada não é input de
    // componente, é token de injeção — trocá-lo exige `providers`, que se
    // resolve na montagem do módulo da story e não a cada mudança de arg. Um
    // control aqui seria um controle que não faz nada.
    NDS_SIDEBAR_MOBILE_QUERY: {
      control: false,
      description:
        'Ponto de virada entre coluna e gaveta sobreposta. Fornecido por `providers`; uma consulta sempre verdadeira, como (min-width: 0px), força a gaveta em qualquer largura.',
      table: {
        type: { summary: 'InjectionToken<string>' },
        defaultValue: { summary: `'(max-width: 767px)'` },
      },
    },
  },
  args: { side: 'left', variant: 'sidebar', collapsible: 'offcanvas', defaultOpen: true },
};

export default meta;
type Story = StoryObj<SidebarArgs>;

export const Playground: Story = {
  parameters: {
    docs: { source: { transform: sidebarPlaygroundSource } },
    covers: [
      'functional.item1', 'functional.item2', 'functional.item6',
      'accessibility.item1', 'accessibility.item2', 'accessibility.item3',
      'accessibility.item4', 'accessibility.item5',
      'visual.item1',
    ],
  },
  render: (args) => ({
    props: { ...args },
    template: `
      <div ndsSidebarProvider [defaultOpen]="defaultOpen">
        <div ndsSidebar [side]="side" [variant]="variant" [collapsible]="collapsible">
          <div ndsSidebarHeader>Acme</div>

          <div ndsSidebarContent>
            <nav aria-label="Navegação principal">
              <div ndsSidebarGroup>
                <div ndsSidebarGroupLabel>Plataforma</div>
                <div ndsSidebarGroupContent>
                  <ul ndsSidebarMenu>
                    <li ndsSidebarMenuItem>
                      <a ndsSidebarMenuButton href="/painel" [active]="true">
                        <svg ndsButtonIcon kind="chevron-right" class="nds-icon"></svg>
                        <span>Painel</span>
                      </a>
                    </li>
                    <li ndsSidebarMenuItem>
                      <a ndsSidebarMenuButton href="/componentes">Componentes</a>
                    </li>
                    <li ndsSidebarMenuItem>
                      <a ndsSidebarMenuButton href="/ajustes">Ajustes</a>
                    </li>
                  </ul>
                </div>
              </div>
            </nav>
          </div>

          <div ndsSidebarFooter>
            <ul ndsSidebarMenu>
              <li ndsSidebarMenuItem>
                <button ndsSidebarMenuButton>Perfil</button>
              </li>
            </ul>
          </div>

          <button ndsSidebarRail></button>
        </div>

        <main ndsSidebarInset>
          <!-- Sem rótulo explícito: o nome acessível tem padrão em português,
               e é ele que a asserção guarda. O texto visível fica de reforço. -->
          <button ndsSidebarTrigger>Alternar</button>
        </main>
      </div>
    `,
  }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const root = () => canvasElement.querySelector<HTMLElement>('[data-slot="sidebar"]')!;

    await step('O estado inicial aparece em data-state', async () => {
      await expect(root().getAttribute('data-state')).toBe(
        args.defaultOpen ? 'expanded' : 'collapsed',
      );
    });

    await step('A navegação tem nome acessível', async () => {
      // Uma sidebar sem nome no <nav> é só "navegação" na lista de marcos do
      // leitor de tela — indistinguível de qualquer outra da página.
      await expect(canvas.getByRole('navigation', { name: 'Navegação principal' })).toBeTruthy();
    });

    await step('O ícone do item não é lido pelo leitor de tela', async () => {
      // O ícone reforça o rótulo, nunca o substitui. Sem `aria-hidden` o item
      // "Painel" viraria "gráfico Painel" — ou pior, só "gráfico" se o ícone
      // tivesse um title.
      const icone = canvasElement.querySelector<SVGElement>(
        '[data-slot="sidebar-menu-button"] svg',
      )!;
      await expect(icone.getAttribute('aria-hidden')).toBe('true');
    });

    await step('O item ativo é anunciado como página atual', async () => {
      // `data-active` é para o CSS; quem não vê a cor precisa do aria-current.
      const active = canvasElement.querySelector<HTMLElement>('[data-active="true"]')!;
      await expect(active.getAttribute('aria-current')).toBe('page');
    });

    await step('O gatilho tem nome acessível, e em português', async () => {
      // Nome EXATO, e não presença: sem o padrão, o gatilho era anunciado pelo
      // que houvesse dentro dele — aqui, o glifo "Alternar" — e nas outras
      // stacks pelo "Toggle Sidebar" cravado no componente.
      const trigger = canvas.getByRole('button', { name: 'Alternar barra lateral' });
      await expect(trigger).toHaveAccessibleName('Alternar barra lateral');
      // A faixa repete a ação com o ponteiro, e a dica dela é o mesmo texto.
      // Era a única das cinco implementações sem dica nenhuma.
      const range = canvasElement.querySelector<HTMLButtonElement>('[data-slot="sidebar-rail"]')!;
      await expect(range.title).toBe('Alternar barra lateral');
    });

    await step('O gatilho alterna, e diz em qual estado está', async () => {
      const trigger = canvas.getByRole('button', { name: 'Alternar barra lateral' });
      const antes = root().getAttribute('data-state');
      await expect(trigger.getAttribute('aria-expanded')).toBe(String(args.defaultOpen));

      await userEvent.click(trigger);
      await expect(root().getAttribute('data-state')).not.toBe(antes);
      await expect(trigger.getAttribute('aria-expanded')).toBe(String(!args.defaultOpen));

      await userEvent.click(trigger);
      await expect(root().getAttribute('data-state')).toBe(antes);
    });

    await step('Ctrl+B alterna de qualquer lugar da página', async () => {
      const antes = root().getAttribute('data-state');
      await userEvent.keyboard('{Control>}b{/Control}');
      await expect(root().getAttribute('data-state')).not.toBe(antes);
      await userEvent.keyboard('{Control>}b{/Control}');
      await expect(root().getAttribute('data-state')).toBe(antes);
    });
  },
};
