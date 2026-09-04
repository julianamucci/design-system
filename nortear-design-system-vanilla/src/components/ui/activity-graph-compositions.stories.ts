import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect } from 'storybook/test';
import {
  OUTSIDE_DAY,
  WIDE_END,
  WIDE_START,
  activityGraphLabels,
  mountActivityGraph,
} from './activity-graph.fixtures';
import {
  activityGraphMonthSnippet,
  activityGraphTightCellsSnippet,
  activityGraphWeekStartSnippet,
  activityGraphYearSnippet,
} from './activity-graph.source';
import { resolveActivityCalendar } from '@shared/primitives/activity-calendar';
import {
  ACTIVITY_DAYS,
  ACTIVITY_END,
  ACTIVITY_MONTH_END,
  ACTIVITY_MONTH_START,
  ACTIVITY_START,
  ACTIVITY_THRESHOLDS,
} from '@shared/primitives/activity-graph-examples';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// O que muda quando a janela muda: um mês, um ano, a semana começando em outro
// dia, um dia declarado fora do período — e o que muda quando quem consome
// aperta a casa.

const meta: Meta = {
  title: 'Components/Conversational/ActivityGraph/Compositions',
  tags: ['conversational'],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: activityGraphYearSnippet },
      description: {
        component:
          'A janela é dado, e é o que esta peça tem que um mapa de calor de janela fixa não tem: um mês, um ano e um período que já passou são a mesma chamada com outras duas datas.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

const pieceOf = (canvasElement: HTMLElement) =>
  canvasElement.querySelector<HTMLElement>('[data-slot="activity-graph"]')!;

const cellsIn = (piece: HTMLElement) => [
  ...piece.querySelectorAll<HTMLElement>('[data-slot="activity-graph-day"]'),
];

/**
 * Um mês só, porque a janela é dado.
 *
 * É o que a fonte absorvida não sabia fazer: lá a janela é fixa nos 365 dias que
 * terminam hoje, e não há como pedir março.
 */
export const SingleMonth: Story = {
  parameters: {
    covers: ['visual.item5'],
    docs: { source: { transform: activityGraphMonthSnippet } },
  },
  render: () =>
    mountActivityGraph({
      days: ACTIVITY_DAYS,
      start: ACTIVITY_MONTH_START,
      end: ACTIVITY_MONTH_END,
      thresholds: ACTIVITY_THRESHOLDS,
      status: 'complete',
    }),
  play: async ({ canvasElement, step }) => {
    const piece = pieceOf(canvasElement);
    const reference = resolveActivityCalendar(ACTIVITY_DAYS, {
      start: ACTIVITY_MONTH_START,
      end: ACTIVITY_MONTH_END,
      thresholds: ACTIVITY_THRESHOLDS,
    })!;

    await step('A grade tem só os dias do mês pedido', async () => {
      const cells = cellsIn(piece);
      await expect(cells.length).toBe(reference.cells.length);
      await expect(cells[0].dataset.date).toBe(ACTIVITY_MONTH_START);
      await expect(cells[cells.length - 1].dataset.date).toBe(ACTIVITY_MONTH_END);
    });

    await step('E um rótulo de mês só, porque a janela cobre um mês', async () => {
      const months = piece.querySelector<HTMLElement>('[data-slot="activity-graph-months"]')!;
      await expect(months.children.length).toBe(1);
      await expect(months.textContent).toBe(
        activityGraphLabels().monthsShort[reference.months[0].month],
      );
    });
  },
};

/**
 * Um ano inteiro, mais largo que a conversa.
 *
 * Cinquenta e três colunas passam de qualquer conversa com o tamanho de casa que
 * a folha declara, e é aí que a camada rola — uma só, com nome e parada de
 * teclado.
 */
export const WholeYear: Story = {
  parameters: {
    covers: ['functional.item10', 'visual.item6'],
    docs: { source: { transform: activityGraphYearSnippet } },
  },
  // A LARGURA É PARTE DO ASSUNTO: a story precisa ser mais estreita que a grade
  // para que a barra exista, e o canvas do Storybook é largo. Sem o teto, esta
  // fotografia mostraria uma grade folgada e o guarda da rolagem ficaria verde
  // sem nada para medir.
  render: () =>
    mountActivityGraph({
      days: ACTIVITY_DAYS,
      start: WIDE_START,
      end: WIDE_END,
      thresholds: ACTIVITY_THRESHOLDS,
      status: 'complete',
      hostClass: 'nds-max-w-md',
    }),
  play: async ({ canvasElement, step }) => {
    const piece = pieceOf(canvasElement);
    const viewport = piece.querySelector<HTMLElement>(
      '[data-slot="activity-graph-viewport"]',
    )!;

    await step('Uma só camada rola, e é a que tem nome e foco', async () => {
      // O desenho é mais largo que a camada: é essa desigualdade que faz a barra
      // existir, e é o elemento que RECORTA que precisa ser medido — a raiz do
      // documento não transborda.
      await expect(viewport.scrollWidth).toBeGreaterThan(viewport.clientWidth);
      await expect(viewport.tabIndex).toBe(0);
      await expect(viewport.getAttribute('role')).toBe('group');
      await expect(viewport.getAttribute('aria-label')).toBe(activityGraphLabels().region);
    });

    await step('Nenhuma outra camada rola', async () => {
      const calendar = piece.querySelector<HTMLElement>(
        '[data-slot="activity-graph-calendar"]',
      )!;
      const list = piece.querySelector<HTMLElement>('[data-slot="activity-graph-days"]')!;
      for (const layer of [calendar, list]) {
        await expect(layer.scrollWidth).toBe(layer.clientWidth);
      }
    });
  },
};

/**
 * A semana começando na segunda.
 *
 * As sete linhas giram junto, e os rótulos de dia acompanham — é a mesma janela
 * lida por quem não começa a semana no domingo.
 */
export const WeekStartsMonday: Story = {
  parameters: {
    covers: ['visual.item7'],
    docs: { source: { transform: activityGraphWeekStartSnippet } },
  },
  render: () =>
    mountActivityGraph({
      days: ACTIVITY_DAYS,
      start: ACTIVITY_START,
      end: ACTIVITY_END,
      thresholds: ACTIVITY_THRESHOLDS,
      weekStart: 1,
      status: 'complete',
    }),
  play: async ({ canvasElement, step }) => {
    const piece = pieceOf(canvasElement);
    const labels = activityGraphLabels();
    const reference = resolveActivityCalendar(ACTIVITY_DAYS, {
      start: ACTIVITY_START,
      end: ACTIVITY_END,
      thresholds: ACTIVITY_THRESHOLDS,
      weekStart: 1,
    })!;

    await step('As linhas giram: o mesmo dia cai em outra linha', async () => {
      // A conta de referência sai do primitivo, com o mesmo começo de semana —
      // e a contraprova é a grade que começa no domingo, que a põe noutra linha.
      const sunday = resolveActivityCalendar(ACTIVITY_DAYS, {
        start: ACTIVITY_START,
        end: ACTIVITY_END,
        thresholds: ACTIVITY_THRESHOLDS,
      })!;
      await expect(reference.cells[0].row).not.toBe(sunday.cells[0].row);

      const first = cellsIn(piece)[0];
      await expect(
        Number(getComputedStyle(first).getPropertyValue('--activity-graph-day-row').trim()),
      ).toBe(reference.cells[0].row);
    });

    await step('E os rótulos de dia acompanham o giro', async () => {
      const weekdays = [
        ...piece.querySelectorAll<HTMLElement>('[data-slot="activity-graph-weekday"]'),
      ];
      await expect(weekdays.map((w) => w.textContent)).toEqual(
        reference.weekdays.map((w) => labels.weekdaysShort[w.weekday]),
      );
    });
  },
};

/**
 * Um dia declarado fora da janela.
 *
 * Não é erro: é quem passou o ano inteiro e pediu um trimestre. Ele não é
 * desenhado, e não entra no total.
 */
export const OutsideDay: Story = {
  parameters: {
    covers: ['functional.item3'],
    docs: { source: { transform: activityGraphMonthSnippet } },
  },
  render: () =>
    mountActivityGraph({
      days: [...ACTIVITY_DAYS, OUTSIDE_DAY],
      start: ACTIVITY_START,
      end: ACTIVITY_END,
      thresholds: ACTIVITY_THRESHOLDS,
      status: 'complete',
    }),
  play: async ({ canvasElement, step }) => {
    const piece = pieceOf(canvasElement);
    // A referência é a MESMA janela SEM o dia de fora: se ele entrasse, o total
    // e a contagem de casas mudariam, e é isso que a asserção mede.
    const reference = resolveActivityCalendar(ACTIVITY_DAYS, {
      start: ACTIVITY_START,
      end: ACTIVITY_END,
      thresholds: ACTIVITY_THRESHOLDS,
    })!;

    await step('O dia de fora não é desenhado', async () => {
      // A data vem da FIXTURE como constante nomeada: literal dentro de string
      // não é alcançado por portão nenhum.
      await expect(
        piece.querySelector(`[data-slot="activity-graph-day"][data-date="${OUTSIDE_DAY.date}"]`),
      ).toBeNull();
      await expect(cellsIn(piece).length).toBe(reference.cells.length);
    });

    await step('E não entra no total', async () => {
      const total = piece.querySelector<HTMLElement>('[data-slot="activity-graph-total"]')!;
      await expect(total.textContent).toContain(String(reference.total));
      await expect(total.textContent).not.toContain(
        String(reference.total + OUTSIDE_DAY.count),
      );
    });
  },
};

/**
 * A casa apertada por quem consome.
 *
 * É a única superfície de customização da peça, e é ela que decide quando a
 * grade passa a rolar. Entra por propriedade personalizada na folha de quem
 * monta, e nunca por largura em `style`.
 */
export const TightCells: Story = {
  parameters: {
    covers: ['visual.item8'],
    docs: { source: { transform: activityGraphTightCellsSnippet } },
  },
  // OS DOIS LADO A LADO, e é o único jeito de a asserção medir alguma coisa: o
  // valor da propriedade lido por `getPropertyValue` é o ESPECIFICADO, e num
  // token declarado por `calc()` ele volta como a expressão, não como o pixel. O
  // que compara de verdade é a largura da caixa, e para comparar é preciso haver
  // duas.
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.className = 'nds-stack nds-w-full';
    wrapper.dataset.spacing = 'lg';

    const defaultHost = mountActivityGraph({
      days: ACTIVITY_DAYS,
      start: ACTIVITY_MONTH_START,
      end: ACTIVITY_MONTH_END,
      thresholds: ACTIVITY_THRESHOLDS,
      status: 'complete',
      testid: 'activity-graph-default-cells',
    });

    const tightHost = mountActivityGraph({
      days: ACTIVITY_DAYS,
      start: ACTIVITY_MONTH_START,
      end: ACTIVITY_MONTH_END,
      thresholds: ACTIVITY_THRESHOLDS,
      status: 'complete',
      testid: 'activity-graph-tight-cells',
    });
    // Declarada NO PRÓPRIO elemento, e não no invólucro: a folha a declara em
    // `.nds-activity-graph`, e propriedade personalizada declarada dentro do
    // próprio seletor vence a herança — o invólucro nunca a alcançaria.
    (tightHost.firstElementChild as HTMLElement).style.setProperty(
      '--activity-graph-cell',
      'var(--spacing-2)',
    );

    wrapper.append(defaultHost, tightHost);
    return wrapper;
  },
  play: async ({ canvasElement, step }) => {
    const widthOf = (testid: string) =>
      canvasElement
        .querySelector<HTMLElement>(
          `[data-testid="${testid}"] [data-slot="activity-graph-day"]`,
        )!
        .getBoundingClientRect().width;

    await step('A casa aperta, e a grade encolhe com ela', async () => {
      // A largura da casa é COMPUTADA, e é o que prova que a propriedade chegou
      // ao elemento — ler o `style` provaria só que alguém escreveu ali.
      await expect(widthOf('activity-graph-tight-cells')).toBeLessThan(
        widthOf('activity-graph-default-cells'),
      );
    });
  },
};
