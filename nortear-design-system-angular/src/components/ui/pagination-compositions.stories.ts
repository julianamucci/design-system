import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { signal } from '@angular/core';
import { expect, fn, userEvent, within } from 'storybook/test';
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
import {
  paginationInteractiveSource,
  paginationLastPageSource,
  paginationSimpleSource,
  paginationWithEllipsisSource,
  LABEL_NEXT,
  LABEL_PAGE,
  LABEL_PREVIOUS,
} from './pagination.source';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// `controls.disable`: nenhuma story daqui tem argTypes, e sem isso o painel
// Controls aparece vazio.
//
// POR QUE ESTAS QUATRO MORAM AQUI: `Simple`, `WithEllipsis`, `LastPage` e
// `Interactive` são composições em todas as outras stacks, e nesta viviam em
// `Variants` e `States`. Quem lê a documentação de uma stack encontrava a mesma
// story em outro lugar da barra lateral — o grupo sai do ARQUIVO, então alinhar
// é mover o arquivo, não renomear a story.

const meta: Meta = {
  title: 'Components/Navigation/Pagination/Compositions',
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
          'Composições do Pagination: faixa curta sem reticências, lista longa colapsada, última página com Próxima desabilitado e a faixa cujo estado vive fora do componente.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/** Espião de escopo de módulo: dentro do `render`, a play não o alcançaria. */
const onPageChange = fn();

// ─── Simples (até 7 páginas) ──────────────────────────────────────────────────

export const Simple: Story = {
  parameters: {
    covers: ['visual.item1', 'accessibility.item6'],
    docs: {
      source: { transform: paginationSimpleSource },
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
      pageLabel: LABEL_PAGE,
      labelPrevious: LABEL_PREVIOUS,
      labelNext: LABEL_NEXT,
    },
    template: `
      <nav ndsPagination label="Paginação simples">
        <ul ndsPaginationContent>
          <li ndsPaginationItem>
            <button ndsPaginationPrevious type="button" text="Anterior" [label]="labelPrevious" [disabled]="true"></button>
          </li>
          @for (n of pages; track n) {
            <li ndsPaginationItem>
              <button
                ndsPaginationLink
                type="button"
                [isActive]="n === current"
                [attr.aria-label]="pageLabel + ' ' + n"
              >{{ n }}</button>
            </li>
          }
          <li ndsPaginationItem>
            <button ndsPaginationNext type="button" text="Próxima" [label]="labelNext"></button>
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
      // accessibility.item6 — o controle numerado usa o tamanho `icon`: quadrado,
      // sem padding lateral. WCAG 2.5.8 pede 24×24 CSS px, e o colhedor
      // compartilhado mede TODO controle da faixa, não só o primeiro.
      const first = canvas.getByRole('button', { name: `${LABEL_PAGE} 1` });
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
      source: { transform: paginationWithEllipsisSource },
      description: {
        story:
          'Lista longa: primeira, última, atual e vizinhas ficam visíveis; o resto vira reticências decorativas.',
      },
    },
  },
  render: () => ({
    props: {
      // A faixa recortada de um total de 12: 1 … 5 6 7 … 12.
      sections: [1, 'ellipsis', 5, 6, 7, 'ellipsis', 12] as (number | string)[],
      current: 6,
      pageLabel: LABEL_PAGE,
      labelPrevious: LABEL_PREVIOUS,
      labelNext: LABEL_NEXT,
    },
    template: `
      <nav ndsPagination label="Paginação com reticências">
        <ul ndsPaginationContent>
          <li ndsPaginationItem>
            <button ndsPaginationPrevious type="button" text="Anterior" [label]="labelPrevious"></button>
          </li>
          @for (section of sections; track $index) {
            <li ndsPaginationItem>
              @if (section === 'ellipsis') {
                <span ndsPaginationEllipsis></span>
              } @else {
                <button
                  ndsPaginationLink
                  type="button"
                  [isActive]="section === current"
                  [attr.aria-label]="pageLabel + ' ' + section"
                >{{ section }}</button>
              }
            </li>
          }
          <li ndsPaginationItem>
            <button ndsPaginationNext type="button" text="Próxima" [label]="labelNext"></button>
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
      const collapsed = nav.querySelectorAll('[data-slot="pagination-ellipsis"]');
      await expect(collapsed.length).toBe(2);
      for (const item of collapsed) {
        // notes.item3: o caractere tipográfico, não três pontos.
        await expect(item.textContent?.trim()).toBe('…');
        await expect(item).toHaveClass('nds-pagination-ellipsis');
      }
    });

    await step('As reticências não são lidas nem tabuladas', async () => {
      // São decoração: o número que elas escondem já está nos controles vizinhos.
      const collapsed = canvasElement.querySelectorAll('[data-slot="pagination-ellipsis"]');
      for (const item of collapsed) {
        await expect(item).toHaveAttribute('aria-hidden', 'true');
        await expect(item.hasAttribute('tabindex')).toBe(false);
      }
      // Só os cinco números continuam navegáveis, mais Previous e Next.
      await expect(canvas.getAllByRole('button').length).toBe(7);
    });
  },
};

// ─── Última página ────────────────────────────────────────────────────────────

/**
 * Faixa de 5 páginas na última posição.
 *
 * Mora aqui, e não em `States`, porque é onde as outras quatro stacks a põem —
 * o par dela, `FirstPage`, é que é estado puro e continua lá.
 */
export const LastPage: Story = {
  parameters: {
    covers: ['functional.item3'],
    docs: {
      source: { transform: paginationLastPageSource },
      description: {
        story:
          'Na última página o controle Próxima fica desabilitado, pelo mesmo par de atributos usado em Anterior.',
      },
    },
  },
  render: () => ({
    props: {
      current: 5,
      total: 5,
      // Derivado do total: uma lista literal deixaria de acompanhar a faixa.
      pages: Array.from({ length: 5 }, (_, i) => i + 1),
      pageLabel: LABEL_PAGE,
      labelPrevious: LABEL_PREVIOUS,
      labelNext: LABEL_NEXT,
      // Sem rota o controle é botão: não há navegação a anular, só o aviso a
      // quem guarda a página.
      onNavigate: (page: number) => onPageChange(page),
    },
    template: `
      <nav ndsPagination label="Paginação na última página">
        <ul ndsPaginationContent>
          <li ndsPaginationItem>
            <button
              ndsPaginationPrevious
              type="button"
              text="Anterior"
              [label]="labelPrevious"
              [disabled]="current === 1"
              (click)="onNavigate(current - 1)"
            ></button>
          </li>
          @for (n of pages; track n) {
            <li ndsPaginationItem>
              <button
                ndsPaginationLink
                type="button"
                [isActive]="n === current"
                [attr.aria-label]="pageLabel + ' ' + n"
                (click)="onNavigate(n)"
              >{{ n }}</button>
            </li>
          }
          <li ndsPaginationItem>
            <button
              ndsPaginationNext
              type="button"
              text="Próxima"
              [label]="labelNext"
              [disabled]="current === total"
              (click)="onNavigate(current + 1)"
            ></button>
          </li>
        </ul>
      </nav>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const next = canvas.getByRole('button', { name: LABEL_NEXT });

    await step('Próxima está marcado como desabilitado', async () => {
      // Sem rota o controle é `<button>`: quem desabilita é o atributo nativo,
      // e o par aria-disabled + tabindex negativo — que é do caminho de âncora
      // — não deve sobrar aqui, porque dois mecanismos é um a mais.
      await expect(next).toBeDisabled();
      await expect(next.hasAttribute('aria-disabled')).toBe(false);
      await expect(next.hasAttribute('tabindex')).toBe(false);
      await expect(getComputedStyle(next).pointerEvents).toBe('none');
    });

    await step('Clicar em Próxima não navega', async () => {
      // functional.item3 — o método `click()` e não `userEvent`: o CSS já barra
      // o ponteiro, e o que falta provar é o outro caminho. Em controle de
      // formulário desabilitado o `click()` RETORNA sem disparar nada — é o
      // navegador barrando, sem guarda de JavaScript no meio.
      onPageChange.mockClear();
      next.click();
      await expect(onPageChange).not.toHaveBeenCalled();
    });

    await step('A página atual é a última da faixa', async () => {
      const active = canvas.getByRole('button', { name: `${LABEL_PAGE} 5` });
      await expect(active).toHaveAttribute('aria-current', 'page');
      await expect(active).toHaveClass('nds-button-outline');
    });
  },
};

// ─── Interativa (estado externo) ──────────────────────────────────────────────

export const Interactive: Story = {
  parameters: {
    covers: ['functional.item1', 'visual.item3'],
    docs: {
      source: { transform: paginationInteractiveSource },
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
        pageLabel: LABEL_PAGE,
        labelPrevious: LABEL_PREVIOUS,
        labelNext: LABEL_NEXT,
        goTo: (page: number) => current.set(page),
      },
      template: `
        <div class="nds-stack" data-spacing="sm">
          <nav ndsPagination label="Paginação interativa">
            <ul ndsPaginationContent>
              <li ndsPaginationItem>
                <button
                  ndsPaginationPrevious
                  type="button"
                  text="Anterior"
                  [label]="labelPrevious"
                  [disabled]="current() === 1"
                  (click)="goTo(current() - 1)"
                ></button>
              </li>
              @for (n of pages; track n) {
                <li ndsPaginationItem>
                  <button
                    ndsPaginationLink
                    type="button"
                    [isActive]="n === current()"
                    [attr.aria-label]="pageLabel + ' ' + n"
                    (click)="goTo(n)"
                  >{{ n }}</button>
                </li>
              }
              <li ndsPaginationItem>
                <button
                  ndsPaginationNext
                  type="button"
                  text="Próxima"
                  [label]="labelNext"
                  [disabled]="current() === total"
                  (click)="goTo(current() + 1)"
                ></button>
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
      const active = canvas.getByRole('button', { name: `${LABEL_PAGE} 3` });
      await expect(active).toHaveAttribute('aria-current', 'page');
      await expect(active).toHaveClass('nds-button-outline');
    });

    await step('Clicar numa página move o destaque', async () => {
      // functional.item1 — clicar em 6 muda o estado, e o destaque migra: é a
      // prova de que o `isActive` é reativo e não um atributo carimbado uma vez.
      await userEvent.click(canvas.getByRole('button', { name: `${LABEL_PAGE} 6` }));
      const moved = canvas.getByRole('button', { name: `${LABEL_PAGE} 6` });
      await expect(moved).toHaveAttribute('aria-current', 'page');
      await expect(canvas.getByRole('button', { name: `${LABEL_PAGE} 3` })).not.toHaveAttribute(
        'aria-current',
      );
      await expect(
        canvasElement.querySelector('[data-slot="pagina-atual"]'),
      ).toHaveTextContent('Página 6 de 8');
    });

    await step('Só uma página é a atual em qualquer momento', async () => {
      const marked = canvasElement.querySelectorAll('[aria-current="page"]');
      await expect(marked.length).toBe(1);
    });
  },
};
