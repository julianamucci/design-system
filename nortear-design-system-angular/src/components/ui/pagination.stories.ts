import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import {
  NdsPagination,
  NdsPaginationContent,
  NdsPaginationEllipsis,
  NdsPaginationItem,
  NdsPaginationLink,
  NdsPaginationNext,
  NdsPaginationPrevious,
} from './pagination';
import { NdsPaginationDocs } from '@/components/docs/PaginationDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────

type PaginationArgs = {
  total: number;
  atual: number;
  textoAnterior: string;
  textoProxima: string;
};

/** Rótulos acessíveis fixos — não são controls, então ficam fora dos `args`. */
const ROTULO_ANTERIOR = 'Ir para a página anterior';
const ROTULO_PROXIMA = 'Ir para a próxima página';
const ROTULO_PAGINA = 'Ir para página';

/**
 * O painel Code imprime o `template` da story literalmente — com o `@for` que
 * monta a faixa de números e com os bindings ligados aos args. É o andaime da
 * story, não o que alguém escreve para usar uma paginação. O `transform`
 * devolve o uso real, com o valor atual dos controls já resolvido. Ver a nota
 * em `separator.stories.ts` e a armadilha 3 do CLAUDE.md deste stack.
 */
function playgroundSource(_gerado: string, ctx: { args?: Partial<PaginationArgs> }): string {
  const {
    total = 5,
    atual = 2,
    textoAnterior = 'Anterior',
    textoProxima = 'Próxima',
  } = ctx.args ?? {};

  return `import {
  NdsPagination, NdsPaginationContent, NdsPaginationItem,
  NdsPaginationLink, NdsPaginationPrevious, NdsPaginationNext,
} from '@/components/ui/pagination';

@Component({
  imports: [
    NdsPagination, NdsPaginationContent, NdsPaginationItem,
    NdsPaginationLink, NdsPaginationPrevious, NdsPaginationNext,
  ],
  template: \`
    <nav ndsPagination>
      <ul ndsPaginationContent>
        <li ndsPaginationItem>
          <a
            ndsPaginationPrevious
            href="#"
            text="${textoAnterior}"
            label="${ROTULO_ANTERIOR}"
            [disabled]="atual() === 1"
            (click)="irPara($event, atual() - 1)"
          ></a>
        </li>
        @for (n of paginas; track n) {
          <li ndsPaginationItem>
            <a
              ndsPaginationLink
              href="#"
              [isActive]="n === atual()"
              [attr.aria-label]="'${ROTULO_PAGINA} ' + n"
              (click)="irPara($event, n)"
            >{{ n }}</a>
          </li>
        }
        <li ndsPaginationItem>
          <a
            ndsPaginationNext
            href="#"
            text="${textoProxima}"
            label="${ROTULO_PROXIMA}"
            [disabled]="atual() === total"
            (click)="irPara($event, atual() + 1)"
          ></a>
        </li>
      </ul>
    </nav>
  \`,
})
export class Exemplo {
  readonly total = ${total};
  readonly paginas = Array.from({ length: this.total }, (_, i) => i + 1);
  readonly atual = signal(${atual});

  irPara(evento: Event, pagina: number): void {
    evento.preventDefault();
    this.atual.set(pagina);
  }
}`;
}

const meta: Meta<PaginationArgs> = {
  title: 'UI/Pagination',
  tags: ['autodocs', 'navigation'],
  decorators: [
    moduleMetadata({
      imports: [
        NdsPagination,
        NdsPaginationContent,
        NdsPaginationItem,
        NdsPaginationLink,
        NdsPaginationPrevious,
        NdsPaginationNext,
        NdsPaginationEllipsis,
      ],
    }),
  ],
  parameters: {
    layout: 'padded',
    docs: { page: withAutoDocsTab(NdsPaginationDocs) },
  },
  argTypes: {
    total: {
      control: { type: 'number', min: 1, max: 9 },
      description: 'Quantidade de páginas exibidas na faixa numérica.',
    },
    atual: {
      control: { type: 'number', min: 1, max: 9 },
      description: 'Página exibida no momento — recebe aria-current="page".',
    },
    textoAnterior: {
      control: 'text',
      description: 'Rótulo visível do controle de página anterior.',
    },
    textoProxima: {
      control: 'text',
      description: 'Rótulo visível do controle de próxima página.',
    },
  },
  args: {
    total: 5,
    atual: 2,
    textoAnterior: 'Anterior',
    textoProxima: 'Próxima',
  },
};

export default meta;
type Story = StoryObj<PaginationArgs>;

/** Espião de escopo de módulo: dentro do `render`, a play não o alcançaria. */
const onPageChange = fn();

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  parameters: {
    // `visual.item1` saiu daqui: esta play termina com o foco no último
    // controle da faixa, e o Chromatic fotografa o estado FINAL — o "default"
    // que o item pede sai com anel de foco. Quem o cobre é a story `Simple`,
    // que não interage.
    covers: [
      'functional.item1',
      'functional.item4',
      'accessibility.item1',
      'accessibility.item4',
      'accessibility.item5',
    ],
    docs: { source: { transform: playgroundSource } },
  },
  render: (args) => ({
    props: {
      ...args,
      // Derivado do arg, nunca escrito à mão: uma lista literal deixaria de
      // acompanhar o control `total` e a story mentiria em silêncio.
      paginas: Array.from({ length: args.total }, (_, i) => i + 1),
      rotuloAnterior: ROTULO_ANTERIOR,
      rotuloProxima: ROTULO_PROXIMA,
      rotuloPagina: ROTULO_PAGINA,
      irPara: (evento: Event, pagina: number) => {
        evento.preventDefault();
        onPageChange(pagina);
      },
    },
    template: `
      <nav ndsPagination>
        <ul ndsPaginationContent>
          <li ndsPaginationItem>
            <a
              ndsPaginationPrevious
              href="#"
              [text]="textoAnterior"
              [label]="rotuloAnterior"
              [disabled]="atual === 1"
              (click)="irPara($event, atual - 1)"
            ></a>
          </li>
          @for (n of paginas; track n) {
            <li ndsPaginationItem>
              <a
                ndsPaginationLink
                href="#"
                [isActive]="n === atual"
                [attr.aria-label]="rotuloPagina + ' ' + n"
                (click)="irPara($event, n)"
              >{{ n }}</a>
            </li>
          }
          <li ndsPaginationItem>
            <a
              ndsPaginationNext
              href="#"
              [text]="textoProxima"
              [label]="rotuloProxima"
              [disabled]="atual === total"
              (click)="irPara($event, atual + 1)"
            ></a>
          </li>
        </ul>
      </nav>
    `,
  }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);

    await step('A paginação é um landmark de navegação nomeado', async () => {
      // accessibility.item1 — sem nome o leitor de tela anuncia só "navegação",
      // e a pessoa não sabe qual das navegações da página é esta.
      const nav = canvas.getByRole('navigation', { name: 'Paginação' });
      await expect(nav).toHaveAttribute('data-slot', 'pagination');
      await expect(nav.tagName).toBe('NAV');
      await expect(nav).toHaveClass('nds-pagination');

      // A faixa é uma lista: cada controle é um <li>, e a contagem sai do arg,
      // nunca de um número escrito à mão.
      const lista = nav.querySelector('[data-slot="pagination-content"]');
      await expect(lista?.tagName).toBe('UL');
      await expect(lista).toHaveClass('nds-pagination-list');
      await expect(lista!.children.length).toBe(args.total + 2);
    });

    await step('Todo link numerado tem rótulo com contexto', async () => {
      // accessibility.item5 — "3" sozinho não diz nada em voz alta; o número
      // vira nome acessível de verdade com o prefixo.
      for (let n = 1; n <= args.total; n++) {
        const link = canvas.getByRole('link', { name: `${ROTULO_PAGINA} ${n}` });
        await expect(link).toHaveAttribute('data-slot', 'pagination-link');
        await expect(link).toHaveTextContent(String(n));
      }
      // Previous e Next também: o rótulo visível encurta em tela estreita, o
      // nome acessível não.
      await expect(canvas.getByRole('link', { name: ROTULO_ANTERIOR })).toHaveAttribute(
        'data-slot',
        'pagination-previous',
      );
      await expect(canvas.getByRole('link', { name: ROTULO_PROXIMA })).toHaveAttribute(
        'data-slot',
        'pagination-next',
      );
    });

    await step('A página atual é marcada e destacada', async () => {
      // accessibility.item4 — e prova que os inputs chegaram ao template: sem
      // AOT o binding cai em silêncio e TODOS os links ficariam ghost
      // (armadilha 1 do CLAUDE.md deste stack).
      const ativo = canvas.getByRole('link', { name: `${ROTULO_PAGINA} ${args.atual}` });
      await expect(ativo).toHaveAttribute('aria-current', 'page');
      await expect(ativo).toHaveAttribute('data-active', 'true');
      await expect(ativo).toHaveClass('nds-button-outline');

      const inativo = canvas.getByRole('link', { name: `${ROTULO_PAGINA} ${args.atual + 1}` });
      await expect(inativo.hasAttribute('aria-current')).toBe(false);
      await expect(inativo).toHaveClass('nds-button-ghost');
    });

    await step('O rótulo visível de Previous e Next vem do input', async () => {
      const anterior = canvas.getByRole('link', { name: ROTULO_ANTERIOR });
      const proxima = canvas.getByRole('link', { name: ROTULO_PROXIMA });
      await expect(anterior.querySelector('.nds-pagination-label')).toHaveTextContent(
        args.textoAnterior,
      );
      await expect(proxima.querySelector('.nds-pagination-label')).toHaveTextContent(
        args.textoProxima,
      );
      // O ícone direcional continua no DOM mesmo quando o rótulo some no
      // breakpoint estreito — é o que sobra para orientar.
      await expect(anterior.querySelector('svg')).not.toBeNull();
      await expect(proxima.querySelector('svg')).not.toBeNull();
    });

    await step('Clicar numa página numerada avisa quem controla o estado', async () => {
      // functional.item1 — cada passo estabelece a própria precondição: zerar o
      // espião aqui é o que faz a contagem valer nesta rodada, inclusive no
      // replay do painel Interactions, que roda no mesmo DOM.
      onPageChange.mockClear();
      await userEvent.click(canvas.getByRole('link', { name: `${ROTULO_PAGINA} ${args.total}` }));
      await expect(onPageChange).toHaveBeenCalledTimes(1);
      await expect(onPageChange).toHaveBeenLastCalledWith(args.total);
    });

    await step('Tab percorre os controles na ordem visual', async () => {
      // functional.item4 — a ordem de foco é a do DOM, e o DOM é a ordem em que
      // a faixa é lida: anterior, 1..N, próxima.
      const esperados = [
        canvas.getByRole('link', { name: ROTULO_ANTERIOR }),
        ...Array.from({ length: args.total }, (_, i) =>
          canvas.getByRole('link', { name: `${ROTULO_PAGINA} ${i + 1}` }),
        ),
        canvas.getByRole('link', { name: ROTULO_PROXIMA }),
      ];
      (document.activeElement as HTMLElement | null)?.blur();
      for (const alvo of esperados) {
        await userEvent.tab();
        await expect(alvo).toHaveFocus();
      }
    });
  },
};
