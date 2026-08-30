import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, userEvent } from 'storybook/test';
import { NdsScrollArea, type ScrollAreaSize } from './scroll-area';
import { NdsScrollAreaDocs } from '@/components/docs/ScrollAreaDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

type ScrollAreaArgs = {
  orientation: 'vertical' | 'horizontal' | 'both';
  itemCount: number;
  size: ScrollAreaSize;
  label: string;
};

/**
 * O painel Code imprime o `template` da story literalmente — com o `@if` que
 * alterna os três exemplos e com os bindings ligados aos args. Ninguém escreve
 * isso ao usar o componente. O `transform` devolve o uso real a partir dos
 * valores atuais dos controls (armadilha 3 do CLAUDE.md deste stack).
 */
function playgroundSource(_gerado: string, ctx: { args?: Partial<ScrollAreaArgs> }): string {
  const {
    orientation = 'vertical',
    size = 'lg',
    label = 'Lista de tags',
  } = ctx.args ?? {};

  // `size` entra sempre, e não só quando difere do valor de partida: ele não tem
  // default no componente — sem ele não há teto, e sem teto não há rolagem.
  const root = [
    '<div ndsScrollArea',
    `size="${size}"`,
    `label="${label}"`,
    `class="${orientation === 'vertical' ? 'nds-w-sm' : 'nds-max-w-md'} nds-rounded-md nds-border-default"`,
  ]
    .filter(Boolean)
    .join(' ');

  const content =
    orientation === 'vertical'
      ? `  <div class="nds-stack nds-p-4" data-spacing="sm">
    @for (tag of tags; track tag) {
      <p class="nds-text-body nds-m-0">{{ tag }}</p>
    }
  </div>`
      : orientation === 'horizontal'
        ? `  <div class="nds-row nds-p-4 nds-whitespace-nowrap" data-spacing="md">
    @for (card of cards; track card) {
      <div class="nds-shrink-0 nds-w-xs nds-p-4 nds-rounded-md nds-bg-muted">{{ card }}</div>
    }
  </div>`
        : `  <div class="nds-stack nds-p-4" data-spacing="sm">
    @for (linha of linhas; track linha) {
      <div class="nds-row nds-whitespace-nowrap" data-spacing="md">
        @for (coluna of colunas; track coluna) {
          <span class="nds-text-body nds-shrink-0">{{ linha }} · {{ coluna }}</span>
        }
      </div>
    }
  </div>`;

  return `import { NdsScrollArea } from '@/components/ui/scroll-area';

@Component({
  imports: [NdsScrollArea],
  template: \`
    ${root}>
    ${content}
    </div>
  \`,
})
export class Exemplo {}`;
}

const meta: Meta<ScrollAreaArgs> = {
  title: 'Primitives/Layout/ScrollArea',
  tags: ['autodocs', 'layout'],
  decorators: [moduleMetadata({ imports: [NdsScrollArea] })],
  parameters: {
    layout: 'padded',
    docs: { page: withAutoDocsTab(NdsScrollAreaDocs) },
  },
  argTypes: {
    orientation: {
      control: 'radio',
      options: ['vertical', 'horizontal', 'both'],
      description:
        'Forma do CONTEÚDO do exemplo. Não é prop do componente: a direção da rolagem nasce do conteúdo, porque a barra é a nativa do navegador.',
    },
    itemCount: {
      control: { type: 'number', min: 5, max: 60, step: 5 },
      description: 'Quantidade de itens no conteúdo — apenas para o exemplo.',
    },
    size: {
      control: 'radio',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
      description:
        'Degrau da escada de altura da janela rolável, escrito em data-size na raiz. Não tem default: a ausência dele é o cenário da story NoLimit, em States.',
    },
    label: {
      control: 'text',
      description:
        'Nome acessível da região rolável. Vazio não emite papel algum — região anônima não ajuda ninguém.',
    },
  },
  args: {
    orientation: 'vertical',
    itemCount: 30,
    size: 'lg',
    label: 'Lista de tags',
  },
};

export default meta;
type Story = StoryObj<ScrollAreaArgs>;

export const Playground: Story = {
  parameters: {
    docs: { source: { transform: playgroundSource } },
    covers: [
      'functional.item1',
      'functional.item3',
      'accessibility.item1',
      'accessibility.item5',
    ],
    // Os dois itens abaixo descrevem a barra CUSTOMIZADA que as libs headless
    // desenham. Aqui a barra é a nativa do navegador: não existe nó no DOM para
    // arrastar nem para medir contraste — quem desenha é o sistema operacional.
    coversNotApplicable: {
      'functional.item2': 'barra nativa: o pegador e desenhado pelo sistema, nao ha no no DOM para arrastar',
      'accessibility.item2': 'barra nativa: o contraste do pegador e do sistema operacional, fora do DOM',
    },
  },
  render: (args) => {
    const total = Math.max(1, args.itemCount);
    return {
      props: {
        ...args,
        // Listas derivadas aqui, não no template: expressão de template Angular
        // não tem globais (`Array`, `String`) — armadilha 4 do CLAUDE.md.
        tags: Array.from({ length: total }, (_, i) => `Tag ${i + 1}`),
        cards: Array.from({ length: total }, (_, i) => `Card ${i + 1}`),
        lines: Array.from({ length: total }, (_, i) => `L${i + 1}`),
        colunas: Array.from({ length: 12 }, (_, i) => `C${i + 1}`),
      },
      template: `
        @if (orientation === 'horizontal') {
          <div
            ndsScrollArea
            [label]="label"
            [size]="size"
            class="nds-max-w-md nds-rounded-md nds-border-default"
          >
            <div class="nds-row nds-p-4 nds-whitespace-nowrap" data-spacing="md">
              @for (card of cards; track card) {
                <div class="nds-shrink-0 nds-w-xs nds-p-4 nds-rounded-md nds-bg-muted nds-text-body">
                  {{ card }}
                </div>
              }
            </div>
          </div>
        } @else if (orientation === 'both') {
          <div
            ndsScrollArea
            [label]="label"
            [size]="size"
            class="nds-max-w-md nds-rounded-md nds-border-default"
          >
            <div class="nds-stack nds-p-4" data-spacing="sm">
              @for (line of lines; track line) {
                <div class="nds-row nds-whitespace-nowrap" data-spacing="md">
                  @for (coluna of colunas; track coluna) {
                    <span class="nds-text-body nds-shrink-0">{{ line }} · {{ coluna }}</span>
                  }
                </div>
              }
            </div>
          </div>
        } @else {
          <div
            ndsScrollArea
            [label]="label"
            [size]="size"
            class="nds-w-sm nds-rounded-md nds-border-default"
          >
            <div class="nds-stack nds-p-4" data-spacing="sm">
              @for (tag of tags; track tag) {
                <p class="nds-text-body nds-m-0">{{ tag }}</p>
              }
            </div>
          </div>
        }
      `,
    };
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="scroll-area"]')!;
    const viewport = canvasElement.querySelector<HTMLElement>(
      '[data-slot="scroll-area-viewport"]',
    )!;

    await step('O markup é o mesmo das outras stacks', async () => {
      // Raiz e viewport são dois `<div>` com as classes do design system, não
      // elementos próprios: é o que faz o CSS compartilhado casar sem wrapper.
      await expect(root.tagName).toBe('DIV');
      await expect(root).toHaveClass(/nds-scroll-area/);
      await expect(viewport.tagName).toBe('DIV');
      await expect(viewport).toHaveClass(/nds-scroll-area-viewport/);
    });

    await step('O degrau vem do input e mora na raiz', async () => {
      // Esta é a asserção que prova o binding de input: sob JIT o componente
      // renderiza no valor de partida e o atributo viria sempre o mesmo, com o
      // control em outro degrau (armadilha 1 do CLAUDE.md deste stack).
      //
      // O degrau mora na RAIZ, e não no viewport: é a folha compartilhada que
      // resolve `block-size` ali, e o viewport é `height: 100%` por ela. Com a
      // raiz dimensionada a porcentagem resolve, e não há segunda medida.
      await expect(root.dataset.size).toBe(args.size);
      await expect(viewport.style.blockSize).toBe('');
      await expect(viewport.style.maxBlockSize).toBe('');
    });

    await step('A região rolável tem nome acessível e é alcançável por teclado', async () => {
      // accessibility.item1 (axe) e o par papel+nome: sem papel, `aria-label`
      // seria atributo proibido; com papel e sem nome, a região não vira
      // landmark nenhum. O `tabindex` é o que permite rolar sem mouse.
      await expect(viewport).toHaveAttribute('tabindex', '0');
      if (args.label) {
        await expect(canvas.getByRole('region', { name: args.label })).toBe(viewport);
      } else {
        await expect(viewport.getAttribute('role')).toBeNull();
        await expect(viewport.getAttribute('aria-label')).toBeNull();
      }
    });

    await step('O viewport recebe foco', async () => {
      viewport.focus();
      await expect(document.activeElement).toBe(viewport);
    });

    await step('A rolagem é a nativa do navegador', async () => {
      // accessibility.item5 e functional.item3: teclado (setas, PageUp/PageDown,
      // Home/End) e inércia de toque são comportamento NATIVO de um elemento com
      // `overflow` rolável e foco. Não há como provocá-los por evento sintético
      // — evento não confiável não dispara ação padrão do navegador —, então o
      // que se afirma é o contrato que os habilita: overflow nativo + foco.
      await expect(getComputedStyle(viewport).overflowY).toBe('auto');
      await expect(getComputedStyle(viewport).overflowX).toBe('auto');
    });

    await step('O conteúdo rola dentro do viewport, sem mover a página', async () => {
      // functional.item1. A página é o alvo real do teste: rolagem que escapa
      // para o documento é o defeito clássico deste componente.
      const pageBefore = document.scrollingElement?.scrollTop ?? 0;
      const eixo = args.orientation === 'horizontal' ? 'scrollLeft' : 'scrollTop';
      const maximo =
        eixo === 'scrollLeft'
          ? viewport.scrollWidth - viewport.clientWidth
          : viewport.scrollHeight - viewport.clientHeight;

      // Com degrau há sempre teto, nos três formatos de conteúdo. O cenário sem
      // teto é `functional.item4`, coberto na story NoLimit.
      await expect(maximo).toBeGreaterThan(0);
      viewport[eixo] = 40;
      await expect(viewport[eixo]).toBe(40);
      await expect(document.scrollingElement?.scrollTop ?? 0).toBe(pageBefore);
    });

    await step('Nada do conteúdo é escondido de tecnologia assistiva', async () => {
      // accessibility.item4: o componente estiliza a caixa, não filtra conteúdo.
      // Item fora do campo visível continua no DOM e continua anunciável.
      await expect(viewport.getAttribute('aria-hidden')).toBeNull();
      const items = viewport.querySelectorAll('p, span, div[class*="nds-w-xs"]');
      await expect(items.length).toBeGreaterThan(0);
    });

    await step('O foco chega ao viewport pela navegação por Tab', async () => {
      // Tab e não `.focus()`: o que interessa é que o elemento está NA ordem de
      // tabulação, e não apenas que aceita foco programático.
      viewport.blur();
      let alcancado = false;
      for (let i = 0; i < 5 && !alcancado; i++) {
        await userEvent.tab();
        alcancado = document.activeElement === viewport;
      }
      await expect(alcancado).toBe(true);
    });
  },
};
