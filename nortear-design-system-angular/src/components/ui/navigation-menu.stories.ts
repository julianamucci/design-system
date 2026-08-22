import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, fn, waitFor, userEvent } from 'storybook/test';
import {
  NDS_NAVIGATION_MENU,
  type NavigationMenuAlign,
  type NavigationMenuOrientation,
} from './navigation-menu';
import {
  SELECTOR_PANEL,
  waitForPanel,
  waitForPanelVanish,
  popupOpen,
} from './navigation-menu.fixtures';
import { NdsNavigationMenuDocs } from '@/components/docs/NavigationMenuDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────

type NavigationMenuArgs = {
  orientation: NavigationMenuOrientation;
  align: NavigationMenuAlign;
  delay: number;
  closeDelay: number;
  indicator: boolean;
  onValueChange: (valor: string | null) => void;
};

/**
 * O painel Code imprime o `template` da story como está escrito — com os
 * bindings ligados aos args (`[orientation]="orientation"`). Isso é o andaime da
 * story, não o que alguém escreve para usar a barra. O `transform` devolve o uso
 * real, com os valores atuais dos controls já resolvidos (ver a nota em
 * `separator.stories.ts`).
 */
function playgroundSource(_gerado: string, ctx: { args?: Partial<NavigationMenuArgs> }): string {
  const { orientation = 'horizontal', align = 'start', indicator = false } = ctx.args ?? {};

  // Só o que difere do padrão entra no snippet: repetir valor default ensina
  // ruído a quem copia.
  const raiz = ['<nav ndsNavigationMenu aria-label="Navegação principal"']
    .concat(orientation === 'horizontal' ? [] : [`orientation="${orientation}"`])
    .concat(align === 'start' ? [] : [`align="${align}"`])
    .concat(indicator ? ['indicator'] : [])
    .join(' ') + '>';

  return `import { NDS_NAVIGATION_MENU } from '@/components/ui/navigation-menu';

@Component({
  imports: [...NDS_NAVIGATION_MENU],
  template: \`
    ${raiz}
      <ul ndsNavigationMenuList>
        <li ndsNavigationMenuItem>
          <a ndsNavigationMenuLink href="/" active>Início</a>
        </li>

        <li ndsNavigationMenuItem value="produtos">
          <button ndsNavigationMenuTrigger>Produtos</button>

          <ng-template ndsNavigationMenuContent>
            <ul ndsNavigationMenuPanel class="nds-stack nds-list-none nds-w-xs" data-spacing="xs">
              <li>
                <a ndsNavigationMenuChild href="/produtos/inicial">
                  <div ndsNavigationMenuChildLabel>Plano Inicial</div>
                </a>
              </li>
              <li>
                <a ndsNavigationMenuChild href="/produtos/profissional">
                  <div ndsNavigationMenuChildLabel>Plano Profissional</div>
                </a>
              </li>
            </ul>
          </ng-template>
        </li>

        <li ndsNavigationMenuItem>
          <a ndsNavigationMenuLink href="/sobre">Sobre</a>
        </li>
      </ul>
    </nav>
  \`,
})
export class Exemplo {}`;
}

const meta: Meta<NavigationMenuArgs> = {
  title: 'UI/NavigationMenu',
  tags: ['autodocs', 'navigation'],
  decorators: [moduleMetadata({ imports: [...NDS_NAVIGATION_MENU] })],
  parameters: {
    layout: 'centered',
    docs: { page: withAutoDocsTab(NdsNavigationMenuDocs) },
  },
  argTypes: {
    orientation: {
      control: { type: 'inline-radio' },
      options: ['horizontal', 'vertical'],
      description: 'Direção da barra. Vertical serve a barras laterais e gavetas móveis.',
    },
    align: {
      control: { type: 'inline-radio' },
      options: ['start', 'center', 'end'],
      description: 'Alinhamento do painel no eixo perpendicular ao lado de abertura.',
    },
    delay: {
      control: { type: 'number' },
      description: 'Espera em ms antes de abrir o painel quando o ponteiro entra no gatilho.',
    },
    closeDelay: {
      control: { type: 'number' },
      description: 'Espera em ms antes de fechar depois que o ponteiro sai da barra.',
    },
    indicator: {
      control: 'boolean',
      description: 'Seta apontando para o gatilho ativo.',
    },
    // Função em `args` sem entrada aqui NÃO chega ao template no renderer
    // Angular — o `(onValueChange)` ficaria ligado a nada, sem erro nenhum.
    onValueChange: { control: false, table: { disable: true } },
  },
  args: {
    orientation: 'horizontal',
    align: 'start',
    delay: 50,
    closeDelay: 50,
    indicator: false,
    onValueChange: fn(),
  },
};

export default meta;
type Story = StoryObj<NavigationMenuArgs>;

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  parameters: {
    docs: { source: { transform: playgroundSource } },
    covers: [
      'functional.item1',
      'functional.item2',
      'functional.item3',
      'functional.item4',
      'functional.item7',
      'accessibility.item1',
      'accessibility.item2',
      'accessibility.item5',
    ],
  },
  render: (args) => ({
    props: { ...args },
    template: `
      <nav
        ndsNavigationMenu
        aria-label="Navegação principal"
        [orientation]="orientation"
        [align]="align"
        [delay]="delay"
        [closeDelay]="closeDelay"
        [indicator]="indicator"
        (onValueChange)="onValueChange($event)"
      >
        <ul ndsNavigationMenuList>
          <li ndsNavigationMenuItem>
            <a ndsNavigationMenuLink href="#inicio">Início</a>
          </li>

          <li ndsNavigationMenuItem value="produtos">
            <button ndsNavigationMenuTrigger>Produtos</button>

            <ng-template ndsNavigationMenuContent>
              <ul ndsNavigationMenuPanel class="nds-stack nds-list-none nds-w-xs" data-spacing="xs">
                <li>
                  <a ndsNavigationMenuChild href="#inicial">
                    <div ndsNavigationMenuChildLabel>Plano Inicial</div>
                  </a>
                </li>
                <li>
                  <a ndsNavigationMenuChild href="#profissional">
                    <div ndsNavigationMenuChildLabel>Plano Profissional</div>
                  </a>
                </li>
              </ul>
            </ng-template>
          </li>

          <li ndsNavigationMenuItem value="solucoes">
            <button ndsNavigationMenuTrigger>Soluções</button>

            <ng-template ndsNavigationMenuContent>
              <ul ndsNavigationMenuPanel class="nds-stack nds-list-none nds-w-xs" data-spacing="xs">
                <li>
                  <a ndsNavigationMenuChild href="#marketing">
                    <div ndsNavigationMenuChildLabel>Para Marketing</div>
                  </a>
                </li>
                <li>
                  <a ndsNavigationMenuChild href="#vendas">
                    <div ndsNavigationMenuChildLabel>Para Vendas</div>
                  </a>
                </li>
              </ul>
            </ng-template>
          </li>

          <li ndsNavigationMenuItem>
            <a ndsNavigationMenuLink href="#sobre">Sobre</a>
          </li>
        </ul>
      </nav>
    `,
  }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const barra = canvas.getByRole('navigation', { name: 'Navegação principal' });
    const produtos = canvas.getByRole('button', { name: 'Produtos' });
    const solucoes = canvas.getByRole('button', { name: 'Soluções' });

    await step('A barra é um landmark com nome próprio', async () => {
      // Sem nome, o leitor de tela anuncia só "navegação"; com dois landmarks
      // homônimos na mesma página o axe reprova em landmark-unique.
      await expect(barra.tagName).toBe('NAV');
      await expect(barra.getAttribute('aria-label')).toBe('Navegação principal');
    });

    await step('Os destinos da barra são links de verdade', async () => {
      // O que distingue navegação de menu de comandos: um `<a href>` abre em
      // nova aba, entra no histórico e mostra o destino na barra de status.
      const links = within(barra).getAllByRole('link');
      await expect(links).toHaveLength(2);
      for (const link of links) await expect(link.tagName).toBe('A');
    });

    await step('Fechado, o gatilho anuncia apenas que está recolhido', async () => {
      await expect(produtos.getAttribute('aria-expanded')).toBe('false');
      // `aria-haspopup` prometeria um papel de menu que o painel não tem: a
      // guideline 01 exige que o painel tenha o papel que o gatilho anuncia, e
      // aqui o painel é navegação — uma lista de links, não comandos. O que
      // vale é o padrão de divulgação do APG: `aria-expanded` + `aria-controls`.
      await expect(produtos.hasAttribute('aria-haspopup')).toBe(false);
    });

    await step('Setas movem o foco entre os itens da barra', async () => {
      produtos.focus();
      await userEvent.keyboard('{ArrowRight}');
      await waitFor(async () => {
        await expect(document.activeElement).toBe(solucoes);
      });
      await userEvent.keyboard('{ArrowLeft}');
      await waitFor(async () => {
        await expect(document.activeElement).toBe(produtos);
      });
    });

    await step('Enter abre o painel e leva o foco para dentro dele', async () => {
      await userEvent.keyboard('{Enter}');
      const painel = await waitForPanel();
      await expect(produtos.getAttribute('aria-expanded')).toBe('true');
      await expect(args.onValueChange).toHaveBeenCalledWith('produtos');

      // O painel é alcançável pelo teclado: o foco entra no primeiro destino.
      await waitFor(async () => {
        await expect(painel.contains(document.activeElement)).toBe(true);
      });
      await expect(within(painel).getByRole('link', { name: 'Plano Inicial' })).toBeTruthy();
    });

    await step('Escape fecha e devolve o foco ao gatilho', async () => {
      await userEvent.keyboard('{Escape}');
      await waitForPanelVanish();
      await expect(produtos.getAttribute('aria-expanded')).toBe('false');
      // O foco não pode cair no corpo do documento: quem navega por teclado
      // teria de percorrer a página inteira de novo para voltar ao ponto.
      await waitFor(async () => {
        await expect(document.activeElement).toBe(produtos);
      });
    });

    await step('O ponteiro abre o painel sem clique', async () => {
      await userEvent.hover(produtos);
      const painel = await waitForPanel();
      await expect(painel.textContent).toContain('Plano Inicial');
    });

    await step('Passar de um gatilho ao outro troca o painel sem fechá-lo', async () => {
      await userEvent.hover(solucoes);
      await waitFor(async () => {
        const painel = document.body.querySelector(SELECTOR_PANEL);
        await expect(painel?.textContent).toContain('Para Marketing');
      });
      // O popup é um só e nunca desmontou: é o que `skipDelayDuration` descreve
      // nas outras stacks — a troca é instantânea, sem reabrir a espera.
      await expect(popupOpen()).not.toBeNull();
      await expect(solucoes.getAttribute('aria-expanded')).toBe('true');
    });

    await step('A barra volta ao repouso ao final', async () => {
      // A story termina fechada de propósito: o axe roda depois da play, e um
      // painel flutuante aberto mediria contraste sobre a página inteira.
      await userEvent.keyboard('{Escape}');
      await waitForPanelVanish();
      await expect(solucoes.getAttribute('aria-expanded')).toBe('false');
    });
  },
};
