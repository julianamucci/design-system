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
import {
  paginationPlaygroundSource,
  LABEL_NEXT,
  LABEL_PAGE,
  LABEL_PREVIOUS,
  type PaginationArgs,
} from './pagination.source';
import { NdsPaginationDocs } from '@/components/docs/PaginationDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta<PaginationArgs> = {
  title: 'Components/Navigation/Pagination',
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
    current: {
      control: { type: 'number', min: 1, max: 9 },
      description: 'Página exibida no momento — recebe aria-current="page".',
    },
    previousText: {
      control: 'text',
      description: 'Rótulo visível do controle de página anterior.',
    },
    nextText: {
      control: 'text',
      description: 'Rótulo visível do controle de próxima página.',
    },
  },
  args: {
    total: 5,
    current: 2,
    previousText: 'Anterior',
    nextText: 'Próxima',
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
    docs: { source: { transform: paginationPlaygroundSource } },
  },
  render: (args) => ({
    props: {
      ...args,
      // Derivado do arg, nunca escrito à mão: uma lista literal deixaria de
      // acompanhar o control `total` e a story mentiria em silêncio.
      pages: Array.from({ length: args.total }, (_, i) => i + 1),
      labelPrevious: LABEL_PREVIOUS,
      labelNext: LABEL_NEXT,
      rotuloPagina: LABEL_PAGE,
      irTo: (evento: Event, page: number) => {
        evento.preventDefault();
        onPageChange(page);
      },
    },
    template: `
      <nav ndsPagination>
        <ul ndsPaginationContent>
          <li ndsPaginationItem>
            <a
              ndsPaginationPrevious
              href="#"
              [text]="previousText"
              [label]="labelPrevious"
              [disabled]="current === 1"
              (click)="irTo($event, current - 1)"
            ></a>
          </li>
          @for (n of pages; track n) {
            <li ndsPaginationItem>
              <a
                ndsPaginationLink
                href="#"
                [isActive]="n === current"
                [attr.aria-label]="rotuloPagina + ' ' + n"
                (click)="irTo($event, n)"
              >{{ n }}</a>
            </li>
          }
          <li ndsPaginationItem>
            <a
              ndsPaginationNext
              href="#"
              [text]="nextText"
              [label]="labelNext"
              [disabled]="current === total"
              (click)="irTo($event, current + 1)"
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
      const list = nav.querySelector('[data-slot="pagination-content"]');
      await expect(list?.tagName).toBe('UL');
      await expect(list).toHaveClass('nds-pagination-list');
      await expect(list!.children.length).toBe(args.total + 2);
    });

    await step('Todo link numerado tem rótulo com contexto', async () => {
      // accessibility.item5 — "3" sozinho não diz nada em voz alta; o número
      // vira nome acessível de verdade com o prefixo.
      for (let n = 1; n <= args.total; n++) {
        const link = canvas.getByRole('link', { name: `${LABEL_PAGE} ${n}` });
        await expect(link).toHaveAttribute('data-slot', 'pagination-link');
        await expect(link).toHaveTextContent(String(n));
      }
      // Previous e Next também: o rótulo visível encurta em tela estreita, o
      // nome acessível não.
      await expect(canvas.getByRole('link', { name: LABEL_PREVIOUS })).toHaveAttribute(
        'data-slot',
        'pagination-previous',
      );
      await expect(canvas.getByRole('link', { name: LABEL_NEXT })).toHaveAttribute(
        'data-slot',
        'pagination-next',
      );
    });

    await step('A página atual é marcada e destacada', async () => {
      // accessibility.item4 — e prova que os inputs chegaram ao template: sem
      // AOT o binding cai em silêncio e TODOS os links ficariam ghost
      // (armadilha 1 do CLAUDE.md deste stack).
      const active = canvas.getByRole('link', { name: `${LABEL_PAGE} ${args.current}` });
      await expect(active).toHaveAttribute('aria-current', 'page');
      await expect(active).toHaveAttribute('data-active', 'true');
      await expect(active).toHaveClass('nds-button-outline');

      const inactive = canvas.getByRole('link', { name: `${LABEL_PAGE} ${args.current + 1}` });
      await expect(inactive.hasAttribute('aria-current')).toBe(false);
      await expect(inactive).toHaveClass('nds-button-ghost');
    });

    await step('O rótulo visível de Previous e Next vem do input', async () => {
      const previous = canvas.getByRole('link', { name: LABEL_PREVIOUS });
      const next = canvas.getByRole('link', { name: LABEL_NEXT });
      await expect(previous.querySelector('.nds-pagination-label')).toHaveTextContent(
        args.previousText,
      );
      await expect(next.querySelector('.nds-pagination-label')).toHaveTextContent(
        args.nextText,
      );
      // O ícone direcional continua no DOM mesmo quando o rótulo some no
      // breakpoint estreito — é o que sobra para orientar.
      await expect(previous.querySelector('svg')).not.toBeNull();
      await expect(next.querySelector('svg')).not.toBeNull();
    });

    await step('Clicar numa página numerada avisa quem controla o estado', async () => {
      // functional.item1 — cada passo estabelece a própria precondição: zerar o
      // espião aqui é o que faz a contagem valer nesta rodada, inclusive no
      // replay do painel Interactions, que roda no mesmo DOM.
      onPageChange.mockClear();
      await userEvent.click(canvas.getByRole('link', { name: `${LABEL_PAGE} ${args.total}` }));
      await expect(onPageChange).toHaveBeenCalledTimes(1);
      await expect(onPageChange).toHaveBeenLastCalledWith(args.total);
    });

    await step('Tab percorre os controles na ordem visual', async () => {
      // functional.item4 — a ordem de foco é a do DOM, e o DOM é a ordem em que
      // a faixa é lida: anterior, 1..N, próxima.
      const esperados = [
        canvas.getByRole('link', { name: LABEL_PREVIOUS }),
        ...Array.from({ length: args.total }, (_, i) =>
          canvas.getByRole('link', { name: `${LABEL_PAGE} ${i + 1}` }),
        ),
        canvas.getByRole('link', { name: LABEL_NEXT }),
      ];
      (document.activeElement as HTMLElement | null)?.blur();
      for (const target of esperados) {
        await userEvent.tab();
        await expect(target).toHaveFocus();
      }
    });
  },
};
