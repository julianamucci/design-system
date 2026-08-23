import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, fireEvent, fn, userEvent, within } from 'storybook/test';
import { minimumTargetsBelow, rangeContrastes } from '@shared/testing/pagination-probe';
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
  title: 'UI/Pagination/States',
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
          'Estados dos controles: extremos desabilitados, foco visível por teclado e contraste do texto sobre o fundo.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

const LABEL_PAGE = 'Ir para página';
const LABEL_PREVIOUS = 'Ir para a página anterior';
const LABEL_NEXT = 'Ir para a próxima página';

/** Espião de escopo de módulo: dentro do `render`, a play não o alcançaria. */
const onPageChange = fn();

function aoNavegar(evento: Event, page: number): void {
  evento.preventDefault();
  onPageChange(page);
}

/**
 * Faixa de 5 páginas com os dois extremos parametrizados. Um só molde para as
 * stories de extremo evita que uma delas envelheça sozinha.
 */
function range(label: string, current: number): Record<string, unknown> {
  return {
    props: {
      current,
      total: 5,
      // Derivado do total: uma lista literal deixaria de acompanhar a faixa.
      pages: Array.from({ length: 5 }, (_, i) => i + 1),
      label,
      rotuloPagina: LABEL_PAGE,
      labelPrevious: LABEL_PREVIOUS,
      labelNext: LABEL_NEXT,
      aoNavegar,
    },
    template: `
      <nav ndsPagination [label]="label">
        <ul ndsPaginationContent>
          <li ndsPaginationItem>
            <a
              ndsPaginationPrevious
              href="#"
              text="Anterior"
              [label]="labelPrevious"
              [disabled]="current === 1"
              (click)="aoNavegar($event, current - 1)"
            ></a>
          </li>
          @for (n of pages; track n) {
            <li ndsPaginationItem>
              <a
                ndsPaginationLink
                href="#"
                [isActive]="n === current"
                [attr.aria-label]="rotuloPagina + ' ' + n"
                (click)="aoNavegar($event, n)"
              >{{ n }}</a>
            </li>
          }
          <li ndsPaginationItem>
            <a
              ndsPaginationNext
              href="#"
              text="Próxima"
              [label]="labelNext"
              [disabled]="current === total"
              (click)="aoNavegar($event, current + 1)"
            ></a>
          </li>
        </ul>
      </nav>
    `,
  };
}

// ─── Primeira página ──────────────────────────────────────────────────────────

export const FirstPage: Story = {
  parameters: {
    covers: ['functional.item2', 'visual.item4'],
    docs: {
      description: {
        story:
          'Na primeira página o controle Anterior fica desabilitado: opacidade reduzida, fora da tabulação e sem navegar.',
      },
    },
  },
  render: () => range('Paginação na primeira página', 1),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const previous = canvas.getByRole('link', { name: LABEL_PREVIOUS });

    await step('Anterior está marcado como desabilitado', async () => {
      // visual.item4 — em `<a>` não existe `disabled`; o par correto é
      // aria-disabled + a supressão do clique e da tabulação.
      await expect(previous).toHaveAttribute('aria-disabled', 'true');
      await expect(previous).toHaveAttribute('tabindex', '-1');
      const estilo = getComputedStyle(previous);
      await expect(estilo.pointerEvents).toBe('none');
      await expect(Number(estilo.opacity)).toBeLessThan(1);
    });

    await step('Clicar em Anterior não navega', async () => {
      // functional.item2 — `fireEvent` e não `userEvent`: o CSS já barra o
      // ponteiro, e o que esta asserção precisa provar é o outro caminho — o
      // evento que chega por script ou por teclado também não passa.
      onPageChange.mockClear();
      await fireEvent.click(previous);
      await expect(onPageChange).not.toHaveBeenCalled();
    });

    await step('Próxima continua ativo', async () => {
      const next = canvas.getByRole('link', { name: LABEL_NEXT });
      await expect(next.hasAttribute('aria-disabled')).toBe(false);
      onPageChange.mockClear();
      await userEvent.click(next);
      await expect(onPageChange).toHaveBeenLastCalledWith(2);
    });
  },
};

// ─── Última página ────────────────────────────────────────────────────────────

export const LastPage: Story = {
  parameters: {
    covers: ['functional.item3'],
    docs: {
      description: {
        story:
          'Na última página o controle Próxima fica desabilitado, pelo mesmo par de atributos usado em Anterior.',
      },
    },
  },
  render: () => range('Paginação na última página', 5),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const next = canvas.getByRole('link', { name: LABEL_NEXT });

    await step('Próxima está marcado como desabilitado', async () => {
      await expect(next).toHaveAttribute('aria-disabled', 'true');
      await expect(next).toHaveAttribute('tabindex', '-1');
      await expect(getComputedStyle(next).pointerEvents).toBe('none');
    });

    await step('Clicar em Próxima não navega', async () => {
      // functional.item3
      onPageChange.mockClear();
      await fireEvent.click(next);
      await expect(onPageChange).not.toHaveBeenCalled();
    });

    await step('A página atual é a última da faixa', async () => {
      const active = canvas.getByRole('link', { name: `${LABEL_PAGE} 5` });
      await expect(active).toHaveAttribute('aria-current', 'page');
      await expect(active).toHaveClass('nds-button-outline');
    });
  },
};

// ─── Foco ─────────────────────────────────────────────────────────────────────

export const FocusVisible: Story = {
  parameters: {
    covers: ['accessibility.item3'],
    docs: {
      description: {
        story:
          'Foco por teclado desenha um anel visível em qualquer link da faixa — inclusive no da página atual.',
      },
    },
  },
  render: () => range('Paginação com foco', 3),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O anel de foco aparece no link numerado', async () => {
      // accessibility.item3 — `:focus-visible` é o que separa o anel do clique
      // de mouse; medir a sombra computada é o que prova que a regra do CSS
      // compartilhado chegou ao elemento, e não só que o foco chegou.
      const link = canvas.getByRole('link', { name: `${LABEL_PAGE} 2` });
      link.blur();
      link.focus();
      await expect(link).toHaveFocus();
      await expect(link.matches(':focus-visible')).toBe(true);
      await expect(getComputedStyle(link).boxShadow).not.toBe('none');
    });

    await step('A página atual também é focável', async () => {
      // Ela não navega para lugar nenhum, mas continua alcançável pelo teclado:
      // tirar do fluxo de foco quebraria a leitura sequencial da faixa.
      const active = canvas.getByRole('link', { name: `${LABEL_PAGE} 3` });
      active.blur();
      active.focus();
      await expect(active).toHaveFocus();
      await expect(getComputedStyle(active).boxShadow).not.toBe('none');
    });
  },
};

// ─── Contraste ────────────────────────────────────────────────────────────────
//
// A conta vive no colhedor compartilhado (docs/shared/testing/pagination-probe),
// e não aqui: as cinco stacks medem a mesma coisa do mesmo jeito, então uma
// divergência aparece como diferença de valor e não de método.

export const Contrast: Story = {
  parameters: {
    covers: ['accessibility.item2', 'accessibility.item6'],
    docs: {
      description: {
        story:
          'O texto de todo link da faixa — ativo, inativo e direcional — fica acima de 4.5:1 sobre o fundo em que aparece.',
      },
    },
  },
  render: () => range('Paginação medida por contraste', 3),
  play: async ({ canvasElement, step }) => {
    await step('Todo link passa dos 4.5:1 exigidos para texto', async () => {
      // accessibility.item2 — o texto da faixa tem 14px, tamanho normal pela
      // WCAG (grande é >=24px, ou >=18.66px em negrito), então o limite é 4.5.
      // A página atual troca de variante (ghost → outline): medir TODOS é o que
      // impede um defeito que só apareceria na página selecionada.
      const measurements = rangeContrastes(canvasElement);
      await expect(measurements.length).toBe(7);
      await expect(JSON.stringify(measurements.filter((m) => m.ratio < 4.5))).toBe('[]');
    });

    await step('Todo controle alcança o alvo de toque mínimo', async () => {
      // accessibility.item6
      await expect(JSON.stringify(minimumTargetsBelow(canvasElement))).toBe('[]');
    });
  },
};
