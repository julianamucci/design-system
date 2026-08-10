import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, userEvent, within } from 'storybook/test';
import { NDS_SIDEBAR } from './sidebar';
import { NdsButtonIcon } from './button';
import { NdsSidebarDocs } from '@/components/docs/SidebarDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

type SidebarArgs = {
  side: 'left' | 'right';
  variant: 'sidebar' | 'floating' | 'inset';
  collapsible: 'offcanvas' | 'icon' | 'none';
  defaultOpen: boolean;
};

/** Ver a nota em separator.stories.ts. */
function playgroundSource(_gerado: string, ctx: { args?: Partial<SidebarArgs> }): string {
  const {
    side = 'left',
    variant = 'sidebar',
    collapsible = 'offcanvas',
    defaultOpen = true,
  } = ctx.args ?? {};

  const attrs = [
    side !== 'left' ? `side="${side}"` : '',
    variant !== 'sidebar' ? `variant="${variant}"` : '',
    collapsible !== 'offcanvas' ? `collapsible="${collapsible}"` : '',
  ].filter(Boolean).join(' ');

  return `import { NDS_SIDEBAR } from '@/components/ui/sidebar';

@Component({
  imports: [NDS_SIDEBAR],
  template: \`
    <div ndsSidebarProvider [defaultOpen]="${defaultOpen}">
      <div ndsSidebar${attrs ? ' ' + attrs : ''}>
        <div ndsSidebarHeader>Acme</div>

        <div ndsSidebarContent>
          <nav aria-label="Navegação principal">
            <div ndsSidebarGroup>
              <div ndsSidebarGroupLabel>Plataforma</div>
              <ul ndsSidebarMenu>
                <li ndsSidebarMenuItem>
                  <a ndsSidebarMenuButton href="/painel" [active]="true">Painel</a>
                </li>
                <li ndsSidebarMenuItem>
                  <a ndsSidebarMenuButton href="/ajustes">Ajustes</a>
                </li>
              </ul>
            </div>
          </nav>
        </div>

        <button ndsSidebarRail></button>
      </div>

      <main ndsSidebarInset>
        <button ndsSidebarTrigger aria-label="Alternar barra lateral">☰</button>
      </main>
    </div>
  \`,
})
export class Exemplo {}`;
}

const meta: Meta<SidebarArgs> = {
  title: 'UI/Sidebar',
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [...NDS_SIDEBAR, NdsButtonIcon] })],
  parameters: {
    layout: 'fullscreen',
    docs: { page: withAutoDocsTab(NdsSidebarDocs) },
  },
  argTypes: {
    side: { control: 'inline-radio', options: ['left', 'right'], description: 'Lado da tela.' },
    variant: {
      control: 'inline-radio',
      options: ['sidebar', 'floating', 'inset'],
      description: 'Tratamento visual do painel.',
    },
    collapsible: {
      control: 'inline-radio',
      options: ['offcanvas', 'icon', 'none'],
      description: 'Como a sidebar recolhe.',
    },
    defaultOpen: { control: 'boolean', description: 'Estado inicial.' },
  },
  args: { side: 'left', variant: 'sidebar', collapsible: 'offcanvas', defaultOpen: true },
};

export default meta;
type Story = StoryObj<SidebarArgs>;

export const Playground: Story = {
  parameters: {
    docs: { source: { transform: playgroundSource } },
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
          <button ndsSidebarTrigger aria-label="Alternar barra lateral">Alternar</button>
        </main>
      </div>
    `,
  }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const raiz = () => canvasElement.querySelector<HTMLElement>('[data-slot="sidebar"]')!;

    await step('O estado inicial aparece em data-state', async () => {
      await expect(raiz().getAttribute('data-state')).toBe(
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
      const ativo = canvasElement.querySelector<HTMLElement>('[data-active="true"]')!;
      await expect(ativo.getAttribute('aria-current')).toBe('page');
    });

    await step('O gatilho alterna, e diz em qual estado está', async () => {
      const gatilho = canvas.getByRole('button', { name: 'Alternar barra lateral' });
      const antes = raiz().getAttribute('data-state');
      await expect(gatilho.getAttribute('aria-expanded')).toBe(String(args.defaultOpen));

      await userEvent.click(gatilho);
      await expect(raiz().getAttribute('data-state')).not.toBe(antes);
      await expect(gatilho.getAttribute('aria-expanded')).toBe(String(!args.defaultOpen));

      await userEvent.click(gatilho);
      await expect(raiz().getAttribute('data-state')).toBe(antes);
    });

    await step('Ctrl+B alterna de qualquer lugar da página', async () => {
      const antes = raiz().getAttribute('data-state');
      await userEvent.keyboard('{Control>}b{/Control}');
      await expect(raiz().getAttribute('data-state')).not.toBe(antes);
      await userEvent.keyboard('{Control>}b{/Control}');
      await expect(raiz().getAttribute('data-state')).toBe(antes);
    });
  },
};
