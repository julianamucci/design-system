import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect } from 'storybook/test';
import { ActivityGraph } from './index';
import {
  SCALE_DAYS,
  SCALE_EMPTY_DATE,
  SCALE_END,
  SCALE_START,
  SCALE_TOP_DATE,
  activityGraphLabels,
  useActivityGraphLabels,
} from './activity-graph.fixtures';
import {
  activityGraphBusySnippet,
  activityGraphEmptySnippet,
  activityGraphNoWindowSnippet,
  activityGraphScaleSnippet,
} from './activity-graph.source';
import { activityLevel } from '@shared/primitives/activity-calendar';
import {
  ACTIVITY_DAYS,
  ACTIVITY_DAYS_EMPTY,
  ACTIVITY_END,
  ACTIVITY_START,
  ACTIVITY_THRESHOLDS,
} from '@shared/primitives/activity-graph-examples';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// O estado aqui é da CASA — a força com que ela foi pintada —, e não da peça: o
// que a peça tem é o estado da execução que a escreve, e ele decide uma coisa
// só, se ela se declara ocupada. Por isso esta janela de uma semana fotografa a
// escala inteira lado a lado, e não cinco grades.

const meta: Meta = {
  title: 'Primitives/Conversational/ActivityGraph/States',
  tags: ['conversational'],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: activityGraphScaleSnippet },
      description: {
        component:
          'A escala inteira, com a força da tinta e o tamanho do quadrado crescendo juntos, e a palavra de cada nível para quem não vê nenhum dos dois. A janela sem atividade continua sendo uma grade; a janela que não existe não é desenhada.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

const pieceOf = (canvasElement: HTMLElement) =>
  canvasElement.querySelector<HTMLElement>('[data-slot="activity-graph"]');

const cellOf = (piece: HTMLElement, date: string) =>
  piece.querySelector<HTMLElement>(
    `[data-slot="activity-graph-day"][data-date="${date}"]`,
  )!;

/** A escala inteira, do vazio ao nível cheio. */
export const Scale: Story = {
  parameters: {
    covers: ['functional.item4', 'functional.item9', 'visual.item2'],
    docs: { source: { transform: activityGraphScaleSnippet } },
  },
  render: () => ({
    components: { ActivityGraph },
    setup() {
      return {
        labels: useActivityGraphLabels(),
        days: SCALE_DAYS,
        thresholds: ACTIVITY_THRESHOLDS,
      };
    },
    template: `<ActivityGraph
      :days="days"
      start="${SCALE_START}"
      end="${SCALE_END}"
      :thresholds="thresholds"
      status="complete"
      :labels="labels"
    />`,
  }),
  play: async ({ canvasElement, step }) => {
    const piece = pieceOf(canvasElement)!;
    const labels = activityGraphLabels();

    await step('Cada contagem recebe o nível que a escala manda', async () => {
      // As datas e as contagens saem da FIXTURE, e o nível esperado sai do
      // primitivo: nem o dado nem a conta são reescritos aqui, que é o que
      // impede a asserção e a peça de errarem juntas.
      for (const declared of SCALE_DAYS) {
        const cell = cellOf(piece, declared.date);
        await expect(cell.dataset.level).toBe(
          String(activityLevel(declared.count, ACTIVITY_THRESHOLDS)),
        );
      }
    });

    await step('A escala inteira aparece, do vazio ao teto', async () => {
      // Cinco níveis para quatro degraus: se a grade mostrasse quatro, um
      // degrau estaria sem fotografia.
      const drawnLevels = new Set(
        [...piece.querySelectorAll<HTMLElement>('[data-slot="activity-graph-day"]')].map(
          (c) => c.dataset.level,
        ),
      );
      await expect(drawnLevels.size).toBe(ACTIVITY_THRESHOLDS.length + 1);
    });

    await step('O dia do teto diz a palavra do teto, e o vazio tem frase própria', async () => {
      // As datas vêm da FIXTURE como constantes nomeadas: literal dentro de
      // string não é alcançado por portão nenhum, e um seletor que deixa de
      // casar faz a story LANÇAR em vez de reprovar.
      const top = cellOf(piece, SCALE_TOP_DATE).querySelector<HTMLElement>(
        '[data-slot="activity-graph-day-reading"]',
      )!;
      await expect(top.textContent).toContain(labels.levels[ACTIVITY_THRESHOLDS.length]);

      const empty = cellOf(piece, SCALE_EMPTY_DATE).querySelector<HTMLElement>(
        '[data-slot="activity-graph-day-reading"]',
      )!;
      await expect(empty.textContent).toContain(labels.none.split('{')[0].trim());
      // E a contraprova: a frase do vazio NÃO traz a palavra de nível nenhum.
      await expect(empty.textContent).not.toContain(labels.levels[1]);
    });

    await step('A legenda repete a escala em palavras', async () => {
      const swatches = [
        ...piece.querySelectorAll<HTMLElement>('[data-slot="activity-graph-swatch"]'),
      ];
      await expect(swatches.length).toBe(ACTIVITY_THRESHOLDS.length + 1);
      await expect(swatches.map((s) => s.textContent)).toEqual(
        labels.levels.slice(0, ACTIVITY_THRESHOLDS.length + 1),
      );
    });
  },
};

/**
 * A janela sem atividade nenhuma.
 *
 * GRADE VAZIA É GRADE, e é a diferença desta peça em relação às duas irmãs da
 * família: sem nó não há grafo e sem eixo não há cascata, mas um trimestre em
 * que nada aconteceu É a resposta.
 */
export const EmptyWindow: Story = {
  parameters: {
    covers: ['functional.item2', 'visual.item3'],
    docs: { source: { transform: activityGraphEmptySnippet } },
  },
  render: () => ({
    components: { ActivityGraph },
    setup() {
      return {
        labels: useActivityGraphLabels(),
        days: ACTIVITY_DAYS_EMPTY,
        thresholds: ACTIVITY_THRESHOLDS,
      };
    },
    template: `<ActivityGraph
      :days="days"
      start="${ACTIVITY_START}"
      end="${ACTIVITY_END}"
      :thresholds="thresholds"
      status="complete"
      :labels="labels"
    />`,
  }),
  play: async ({ canvasElement, step }) => {
    const piece = pieceOf(canvasElement)!;

    await step('A grade continua desenhada, com todas as casas apagadas', async () => {
      const cells = [
        ...piece.querySelectorAll<HTMLElement>('[data-slot="activity-graph-day"]'),
      ];
      await expect(cells.length).toBeGreaterThan(0);
      await expect(cells.every((c) => c.dataset.level === '0')).toBe(true);
    });

    await step('O total diz zero, e a legenda continua lá', async () => {
      const total = piece.querySelector<HTMLElement>('[data-slot="activity-graph-total"]')!;
      await expect(total.textContent).toContain('0');
      await expect(
        piece.querySelectorAll('[data-slot="activity-graph-swatch"]').length,
      ).toBe(ACTIVITY_THRESHOLDS.length + 1);
    });
  },
};

/** Enquanto a grade se escreve, com a execução ocupada. */
export const Busy: Story = {
  parameters: {
    covers: ['functional.item7', 'visual.item4'],
    docs: { source: { transform: activityGraphBusySnippet } },
  },
  render: () => ({
    components: { ActivityGraph },
    setup() {
      return {
        labels: useActivityGraphLabels(),
        days: ACTIVITY_DAYS,
        thresholds: ACTIVITY_THRESHOLDS,
      };
    },
    template: `<ActivityGraph
      :days="days"
      start="${ACTIVITY_START}"
      end="${ACTIVITY_END}"
      :thresholds="thresholds"
      status="running"
      :labels="labels"
    />`,
  }),
  play: async ({ canvasElement, step }) => {
    const piece = pieceOf(canvasElement)!;

    await step('Enquanto corre, a peça se declara ocupada', async () => {
      // `aria-busy` é o que substitui a região viva nesta família: ele diz que
      // aquele pedaço da tela ainda se escreve, sem anunciar nada.
      await expect(piece.getAttribute('aria-busy')).toBe('true');
      await expect(piece.querySelectorAll('[aria-live]').length).toBe(0);
    });
  },
};

/**
 * A janela que não existe: o fim antes do começo.
 *
 * É o único caso em que esta peça não desenha nada — e não é o caso da atividade
 * vazia, que continua sendo uma grade. Devolver moldura vazia seria pior que
 * devolver nada: a camada que rola é parada de teclado, e uma parada que leva a
 * uma caixa vazia é ruído com nome.
 */
export const NoWindow: Story = {
  parameters: {
    covers: ['functional.item8'],
    docs: { source: { transform: activityGraphNoWindowSnippet } },
  },
  render: () => ({
    components: { ActivityGraph },
    setup() {
      return {
        labels: useActivityGraphLabels(),
        days: ACTIVITY_DAYS,
        thresholds: ACTIVITY_THRESHOLDS,
      };
    },
    template: `<div class="nds-stack nds-w-full" data-spacing="lg">
      <div data-testid="activity-graph-no-window-host">
        <ActivityGraph
          :days="days"
          start="${ACTIVITY_END}"
          end="${ACTIVITY_START}"
          :thresholds="thresholds"
          status="complete"
          :labels="labels"
        />
      </div>
      <div data-testid="activity-graph-no-scale-host">
        <ActivityGraph
          :days="days"
          start="${ACTIVITY_START}"
          end="${ACTIVITY_END}"
          :thresholds="[]"
          status="complete"
          :labels="labels"
        />
      </div>
    </div>`,
  }),
  play: async ({ canvasElement, step }) => {
    await step('Fim antes do começo não é janela, e nada é desenhado', async () => {
      const host = canvasElement.querySelector<HTMLElement>(
        '[data-testid="activity-graph-no-window-host"]',
      )!;
      await expect(host.children.length).toBe(0);
    });

    await step('Sem escala também não há grade', async () => {
      const host = canvasElement.querySelector<HTMLElement>(
        '[data-testid="activity-graph-no-scale-host"]',
      )!;
      await expect(host.children.length).toBe(0);
      await expect(pieceOf(canvasElement)).toBeNull();
    });
  },
};
