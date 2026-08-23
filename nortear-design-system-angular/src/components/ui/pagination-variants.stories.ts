import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { signal } from '@angular/core';
import { expect, userEvent, within } from 'storybook/test';
import { minimumTargetsBelow } from '@shared/testing/pagination-probe';
import {
  NdsPagination,
  NdsPaginationContent,
  NdsPaginationEllipsis,
  NdsPaginationItem,
  NdsPaginationLink,
  NdsPaginationNext,
  NdsPaginationPrevious,
} from './pagination';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// `controls.disable`: nenhuma story daqui tem argTypes, e sem isso o painel
// Controls aparece vazio.

const meta: Meta = {
  title: 'UI/Pagination/Variants',
  tags: ['navigation'],
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
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Configurações da paginação: faixa curta sem reticências, lista longa colapsada, controle direcional e a versão com estado externo.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

const LABEL_PAGE = 'Ir para página';
const LABEL_PREVIOUS = 'Ir para a página anterior';
const LABEL_NEXT = 'Ir para a próxima página';

// ─── Simples (até 7 páginas) ──────────────────────────────────────────────────

export const Simple: Story = {
  parameters: {
    covers: ['visual.item1', 'accessibility.item6'],
    docs: {
      description: {
        story:
          'Total pequeno: todos os números aparecem em sequência, sem reticências. Previous e Next nas pontas.',
      },
    },
  },
  render: () => ({
    props: {
      current: 1,
      // Derivado, não literal: a faixa e as asserções leem a mesma fonte.
      pages: [1, 2, 3, 4, 5],
      rotuloPagina: LABEL_PAGE,
      labelPrevious: LABEL_PREVIOUS,
      labelNext: LABEL_NEXT,
      semNavegar: (evento: Event) => evento.preventDefault(),
    },
    template: `
      <nav ndsPagination label="Paginação simples">
        <ul ndsPaginationContent>
          <li ndsPaginationItem>
            <a ndsPaginationPrevious href="#" text="Anterior" [label]="labelPrevious" [disabled]="true"></a>
          </li>
          @for (n of pages; track n) {
            <li ndsPaginationItem>
              <a
                ndsPaginationLink
                href="#"
                [isActive]="n === current"
                [attr.aria-label]="rotuloPagina + ' ' + n"
                (click)="semNavegar($event)"
              >{{ n }}</a>
            </li>
          }
          <li ndsPaginationItem>
            <a ndsPaginationNext href="#" text="Próxima" [label]="labelNext" (click)="semNavegar($event)"></a>
          </li>
        </ul>
      </nav>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('A faixa mostra todos os números, sem reticências', async () => {
      // visual.item1 — é o estado que o Chromatic fotografa como "default".
      const nav = canvas.getByRole('navigation', { name: 'Paginação simples' });
      const numbered = nav.querySelectorAll('[data-slot="pagination-link"]');
      await expect(numbered.length).toBe(5);
      await expect([...numbered].map((l) => l.textContent?.trim())).toEqual([
        '1', '2', '3', '4', '5',
      ]);
      await expect(nav.querySelectorAll('[data-slot="pagination-ellipsis"]').length).toBe(0);
    });

    await step('Cada número é um alvo quadrado do tamanho de botão de ícone', async () => {
      // accessibility.item6 — o link numerado usa o tamanho `icon`: quadrado,
      // sem padding lateral. WCAG 2.5.8 pede 24×24 CSS px, e o colhedor
      // compartilhado mede TODO controle da faixa, não só o primeiro.
      const first = canvas.getByRole('link', { name: `${LABEL_PAGE} 1` });
      await expect(first).toHaveClass('nds-button-icon');
      await expect(JSON.stringify(minimumTargetsBelow(canvasElement))).toBe('[]');
    });
  },
};

// ─── Com reticências (8+ páginas) ─────────────────────────────────────────────

export const WithEllipsis: Story = {
  parameters: {
    covers: ['visual.item2'],
    docs: {
      description: {
        story:
          'Lista longa: primeira, última, atual e vizinhas ficam visíveis; o resto vira reticências decorativas.',
      },
    },
  },
  render: () => ({
    props: {
      // A faixa recortada de um total de 12: 1 … 5 6 7 … 12.
      trechos: [1, 'ellipsis', 5, 6, 7, 'ellipsis', 12] as (number | string)[],
      current: 6,
      rotuloPagina: LABEL_PAGE,
      labelPrevious: LABEL_PREVIOUS,
      labelNext: LABEL_NEXT,
      semNavegar: (evento: Event) => evento.preventDefault(),
    },
    template: `
      <nav ndsPagination label="Paginação com reticências">
        <ul ndsPaginationContent>
          <li ndsPaginationItem>
            <a ndsPaginationPrevious href="#" text="Anterior" [label]="labelPrevious" (click)="semNavegar($event)"></a>
          </li>
          @for (trecho of trechos; track $index) {
            <li ndsPaginationItem>
              @if (trecho === 'ellipsis') {
                <span ndsPaginationEllipsis></span>
              } @else {
                <a
                  ndsPaginationLink
                  href="#"
                  [isActive]="trecho === current"
                  [attr.aria-label]="rotuloPagina + ' ' + trecho"
                  (click)="semNavegar($event)"
                >{{ trecho }}</a>
              }
            </li>
          }
          <li ndsPaginationItem>
            <a ndsPaginationNext href="#" text="Próxima" [label]="labelNext" (click)="semNavegar($event)"></a>
          </li>
        </ul>
      </nav>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('As páginas distantes colapsam em reticências', async () => {
      // visual.item2
      const nav = canvas.getByRole('navigation', { name: 'Paginação com reticências' });
      const reticencias = nav.querySelectorAll('[data-slot="pagination-ellipsis"]');
      await expect(reticencias.length).toBe(2);
      for (const item of reticencias) {
        // notes.item3: o caractere tipográfico, não três pontos.
        await expect(item.textContent?.trim()).toBe('…');
        await expect(item).toHaveClass('nds-pagination-ellipsis');
      }
    });

    await step('As reticências não são lidas nem tabuladas', async () => {
      // São decoração: o número que elas escondem já está nos links vizinhos.
      const reticencias = canvasElement.querySelectorAll('[data-slot="pagination-ellipsis"]');
      for (const item of reticencias) {
        await expect(item).toHaveAttribute('aria-hidden', 'true');
        await expect(item.hasAttribute('tabindex')).toBe(false);
      }
      // Só os cinco números continuam navegáveis, mais Previous e Next.
      await expect(canvas.getAllByRole('link').length).toBe(7);
    });
  },
};

// ─── Direcional ───────────────────────────────────────────────────────────────

export const Directional: Story = {
  parameters: {
    covers: ['accessibility.item5'],
    docs: {
      description: {
        story:
          'Só os controles de direção. O rótulo textual some abaixo de 40rem e o ícone permanece — o nome acessível não muda.',
      },
    },
  },
  render: () => ({
    props: {
      labelPrevious: LABEL_PREVIOUS,
      labelNext: LABEL_NEXT,
      semNavegar: (evento: Event) => evento.preventDefault(),
    },
    template: `
      <nav ndsPagination label="Paginação direcional">
        <ul ndsPaginationContent>
          <li ndsPaginationItem>
            <a ndsPaginationPrevious href="#" text="Anterior" [label]="labelPrevious" (click)="semNavegar($event)"></a>
          </li>
          <li ndsPaginationItem>
            <a ndsPaginationNext href="#" text="Próxima" [label]="labelNext" (click)="semNavegar($event)"></a>
          </li>
        </ul>
      </nav>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O nome acessível não depende do rótulo visível', async () => {
      // accessibility.item5 — "Anterior" some no breakpoint estreito; se o nome
      // acessível viesse do texto visível, o link ficaria mudo justamente em
      // tela pequena.
      const previous = canvas.getByRole('link', { name: LABEL_PREVIOUS });
      const next = canvas.getByRole('link', { name: LABEL_NEXT });
      await expect(previous.querySelector('.nds-pagination-label')).toHaveTextContent('Anterior');
      await expect(next.querySelector('.nds-pagination-label')).toHaveTextContent('Próxima');
      await expect(previous).toHaveClass('nds-pagination-prev');
      await expect(next).toHaveClass('nds-pagination-next');
    });

    await step('O ícone é decoração, não conteúdo', async () => {
      const icons = canvasElement.querySelectorAll('svg');
      await expect(icons.length).toBe(2);
      for (const icone of icons) {
        await expect(icone).toHaveAttribute('aria-hidden', 'true');
      }
    });
  },
};

// ─── Interativa (estado externo) ──────────────────────────────────────────────

export const Interactive: Story = {
  parameters: {
    covers: ['functional.item1', 'visual.item3'],
    docs: {
      description: {
        story:
          'O estado da página atual vive fora do componente. Cada clique reposiciona o destaque e o aria-current.',
      },
    },
  },
  render: () => {
    // Signal e não campo comum: em modo zoneless é o signal que dispara a nova
    // detecção de mudança quando a página muda.
    const current = signal(3);
    const total = 8;
    return {
      props: {
        current,
        total,
        pages: Array.from({ length: total }, (_, i) => i + 1),
        rotuloPagina: LABEL_PAGE,
        labelPrevious: LABEL_PREVIOUS,
        labelNext: LABEL_NEXT,
        irTo: (evento: Event, page: number) => {
          evento.preventDefault();
          current.set(page);
        },
      },
      template: `
        <div class="nds-stack" data-spacing="sm">
          <nav ndsPagination label="Paginação interativa">
            <ul ndsPaginationContent>
              <li ndsPaginationItem>
                <a
                  ndsPaginationPrevious
                  href="#"
                  text="Anterior"
                  [label]="labelPrevious"
                  [disabled]="current() === 1"
                  (click)="irTo($event, current() - 1)"
                ></a>
              </li>
              @for (n of pages; track n) {
                <li ndsPaginationItem>
                  <a
                    ndsPaginationLink
                    href="#"
                    [isActive]="n === current()"
                    [attr.aria-label]="rotuloPagina + ' ' + n"
                    (click)="irTo($event, n)"
                  >{{ n }}</a>
                </li>
              }
              <li ndsPaginationItem>
                <a
                  ndsPaginationNext
                  href="#"
                  text="Próxima"
                  [label]="labelNext"
                  [disabled]="current() === total"
                  (click)="irTo($event, current() + 1)"
                ></a>
              </li>
            </ul>
          </nav>
          <p class="nds-text-body" data-slot="pagina-atual">Página {{ current() }} de {{ total }}</p>
        </div>
      `,
    };
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O destaque acompanha o estado externo', async () => {
      // visual.item3 — a página 3 nasce ativa porque é o valor do signal.
      const active = canvas.getByRole('link', { name: `${LABEL_PAGE} 3` });
      await expect(active).toHaveAttribute('aria-current', 'page');
      await expect(active).toHaveClass('nds-button-outline');
    });

    await step('Clicar numa página move o destaque', async () => {
      // functional.item1 — clicar em 6 muda o estado, e o destaque migra: é a
      // prova de que o `isActive` é reativo e não um atributo carimbado uma vez.
      await userEvent.click(canvas.getByRole('link', { name: `${LABEL_PAGE} 6` }));
      const novo = canvas.getByRole('link', { name: `${LABEL_PAGE} 6` });
      await expect(novo).toHaveAttribute('aria-current', 'page');
      await expect(canvas.getByRole('link', { name: `${LABEL_PAGE} 3` })).not.toHaveAttribute(
        'aria-current',
      );
      await expect(
        canvasElement.querySelector('[data-slot="pagina-atual"]'),
      ).toHaveTextContent('Página 6 de 8');
    });

    await step('Só uma página é a atual em qualquer momento', async () => {
      const marcados = canvasElement.querySelectorAll('[aria-current="page"]');
      await expect(marcados.length).toBe(1);
    });
  },
};
