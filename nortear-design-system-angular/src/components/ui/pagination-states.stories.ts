import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
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
import {
  paginationContrastSource,
  paginationFirstPageSource,
  paginationFocusVisibleSource,
  LABEL_NEXT,
  LABEL_PAGE,
  LABEL_PREVIOUS,
} from './pagination.source';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// `controls.disable`: nenhuma story daqui tem argTypes, e sem isso o painel
// Controls aparece vazio.
//
// `LastPage` saiu deste arquivo para `pagination-compositions.stories.ts`: nas
// outras quatro stacks ela é composição, e o grupo da barra lateral sai do
// ARQUIVO. O par dela, `FirstPage`, é estado puro e fica.

const meta: Meta = {
  title: 'Components/Navigation/Pagination/States',
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
          'Estados dos controles: extremo desabilitado, foco visível por teclado e contraste do texto sobre o fundo.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/** Espião de escopo de módulo: dentro do `render`, a play não o alcançaria. */
const onPageChange = fn();

// Sem rota o controle é botão: não há navegação a anular, só o aviso a quem
// guarda a página.
function onNavigate(page: number): void {
  onPageChange(page);
}

/**
 * Faixa de 5 páginas com os dois extremos parametrizados. Um só molde para as
 * stories de estado evita que uma delas envelheça sozinha.
 */
function range(label: string, current: number): Record<string, unknown> {
  return {
    props: {
      current,
      total: 5,
      // Derivado do total: uma lista literal deixaria de acompanhar a faixa.
      pages: Array.from({ length: 5 }, (_, i) => i + 1),
      label,
      pageLabel: LABEL_PAGE,
      labelPrevious: LABEL_PREVIOUS,
      labelNext: LABEL_NEXT,
      onNavigate,
    },
    template: `
      <nav ndsPagination [label]="label">
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
  };
}

// ─── Primeira página ──────────────────────────────────────────────────────────

export const FirstPage: Story = {
  parameters: {
    covers: ['functional.item2', 'visual.item4'],
    docs: {
      source: { transform: paginationFirstPageSource },
      description: {
        story:
          'Na primeira página o controle Anterior fica desabilitado: opacidade reduzida, fora da tabulação e sem navegar.',
      },
    },
  },
  render: () => range('Paginação na primeira página', 1),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const previous = canvas.getByRole('button', { name: LABEL_PREVIOUS });

    await step('Anterior está marcado como desabilitado', async () => {
      // visual.item4 — sem rota o controle é `<button>`, e aí quem desabilita é
      // o atributo nativo: o navegador barra clique e tabulação sozinho. O par
      // aria-disabled + tabindex negativo é do caminho de âncora, e não deve
      // sobrar aqui — dois mecanismos no mesmo elemento é um a mais.
      await expect(previous).toBeDisabled();
      await expect(previous.hasAttribute('aria-disabled')).toBe(false);
      await expect(previous.hasAttribute('tabindex')).toBe(false);
      const styles = getComputedStyle(previous);
      await expect(styles.pointerEvents).toBe('none');
      await expect(Number(styles.opacity)).toBeLessThan(1);
    });

    await step('Clicar em Anterior não navega', async () => {
      // functional.item2 — o método `click()` e não `userEvent`: o CSS já barra
      // o ponteiro, e o que falta provar é o outro caminho. Em controle de
      // formulário desabilitado o `click()` RETORNA sem disparar nada — é o
      // navegador barrando, sem guarda de JavaScript no meio.
      onPageChange.mockClear();
      previous.click();
      await expect(onPageChange).not.toHaveBeenCalled();
    });

    await step('Próxima continua ativo', async () => {
      const next = canvas.getByRole('button', { name: LABEL_NEXT });
      await expect(next).toBeEnabled();
      onPageChange.mockClear();
      await userEvent.click(next);
      await expect(onPageChange).toHaveBeenLastCalledWith(2);
    });
  },
};

// ─── Foco ─────────────────────────────────────────────────────────────────────

export const FocusVisible: Story = {
  parameters: {
    covers: ['accessibility.item3'],
    docs: {
      source: { transform: paginationFocusVisibleSource },
      description: {
        story:
          'Foco por teclado desenha um anel visível em qualquer controle da faixa — inclusive no da página atual.',
      },
    },
  },
  render: () => range('Paginação com foco', 3),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O anel de foco aparece no controle numerado', async () => {
      // accessibility.item3 — `:focus-visible` é o que separa o anel do clique
      // de mouse; medir a sombra computada é o que prova que a regra do CSS
      // compartilhado chegou ao elemento, e não só que o foco chegou.
      const control = canvas.getByRole('button', { name: `${LABEL_PAGE} 2` });
      control.blur();
      control.focus();
      await expect(control).toHaveFocus();
      await expect(control.matches(':focus-visible')).toBe(true);
      await expect(getComputedStyle(control).boxShadow).not.toBe('none');
    });

    await step('A página atual também é focável', async () => {
      // Ela não navega para lugar nenhum, mas continua alcançável pelo teclado:
      // tirar do fluxo de foco quebraria a leitura sequencial da faixa.
      const active = canvas.getByRole('button', { name: `${LABEL_PAGE} 3` });
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
      source: { transform: paginationContrastSource },
      description: {
        story:
          'O texto de todo controle da faixa — ativo, inativo e direcional — fica acima de 4.5:1 sobre o fundo em que aparece.',
      },
    },
  },
  render: () => range('Paginação medida por contraste', 3),
  play: async ({ canvasElement, step }) => {
    await step('Todo controle passa dos 4.5:1 exigidos para texto', async () => {
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
