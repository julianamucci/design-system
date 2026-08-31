import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect } from 'storybook/test';
import { createAgentPlan } from './agent-plan';
import {
  agentPlanLabels,
  everyStatePlan,
  finishedPlan,
  longLabelPlan,
  proposedPlan,
  runningPlan,
} from './agent-plan.fixtures';
import {
  agentPlanEmptySource,
  agentPlanEveryStateSource,
  agentPlanFinishedSource,
  agentPlanInProgressSource,
  agentPlanLongLabelSource,
  agentPlanProposedSource,
} from './agent-plan.source';
import {
  PLAN_STEP_STATES,
  isStepFinished,
  type PlanStep,
} from '@shared/primitives/chat-protocol';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// Os cinco estados de um passo, e as três formas que a lista inteira assume: o
// plano proposto, a lista mantida durante o trabalho e o plano encerrado. Não há
// eixo de forma nesta peça — o desenho é sempre o mesmo, e o que muda é em que
// pé está cada passo.

const meta: Meta = {
  title: 'Primitives/Conversational/AgentPlan/States',
  tags: ['conversational'],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: agentPlanEveryStateSource },
      description: {
        component:
          'O estado decide a palavra e o marcador — e o passo atual é sempre o primeiro que ainda não terminou.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/**
 * Monta a lista, num invólucro que aceita a ausência.
 *
 * A fábrica devolve nada quando não há passo nenhum, e o renderer html pede um
 * elemento: sem o invólucro, a story da lista vazia não teria o que devolver.
 */
const mount = (steps: PlanStep[]) => {
  const host = document.createElement('div');
  host.className = 'nds-max-w-lg';
  const plan = createAgentPlan({ steps, labels: agentPlanLabels() });
  if (plan) host.appendChild(plan);
  return host;
};

const planOf = (canvasElement: HTMLElement) =>
  canvasElement.querySelector<HTMLElement>('[data-slot="agent-plan"]');

const stepsOf = (canvasElement: HTMLElement) => [
  ...canvasElement.querySelectorAll<HTMLElement>('[data-slot="agent-plan-step"]'),
];

const currentOf = (canvasElement: HTMLElement) => [
  ...canvasElement.querySelectorAll<HTMLElement>('[aria-current="step"]'),
];

/**
 * Um passo por estado, um abaixo do outro.
 *
 * A lista sai de `PLAN_STEP_STATES`, e não de cinco linhas escritas à mão:
 * estado novo no vocabulário compartilhado entra nesta story sozinho, que é
 * exatamente o que aquela constante existe para garantir.
 */
export const EveryState: Story = {
  parameters: {
    covers: ['functional.item1', 'accessibility.item4', 'visual.item2'],
  },
  render: () => mount(everyStatePlan()),
  play: async ({ canvasElement, step }) => {
    const steps = stepsOf(canvasElement);
    const labels = agentPlanLabels();

    await step('Há um passo por estado, na ordem do vocabulário', async () => {
      await expect(steps).toHaveLength(PLAN_STEP_STATES.length);
      await expect(steps.map((el) => el.dataset.state)).toEqual([...PLAN_STEP_STATES]);
    });

    await step('Cada um traz a PALAVRA daquele estado, e o marcador sai da leitura', async () => {
      for (const [index, state] of PLAN_STEP_STATES.entries()) {
        const el = steps[index]!;
        const badge = el.querySelector<HTMLElement>('[data-slot="agent-plan-state"]')!;
        await expect(badge.textContent).toBe(labels.state[state]);
        const marker = el.querySelector<HTMLElement>('[data-slot="agent-plan-marker"]')!;
        await expect(marker.getAttribute('aria-hidden')).toBe('true');
      }
    });

    await step('E as cinco palavras são CINCO nomes diferentes', async () => {
      // Cinco estados distinguidos só por forma e cor não chegam a quem não os
      // vê (decisão 3 da folha). Se duas palavras coincidissem, dois estados
      // voltariam a se distinguir só pelo desenho.
      const words = PLAN_STEP_STATES.map((state) => labels.state[state]);
      await expect(new Set(words).size).toBe(PLAN_STEP_STATES.length);
    });

    await step('Um passo, no máximo, é o atual', async () => {
      // "Atual" que aponta para três lugares deixa de responder onde estamos.
      await expect(currentOf(canvasElement).length).toBeLessThanOrEqual(1);
    });
  },
};

export const Proposed: Story = {
  parameters: {
    covers: ['functional.item3', 'visual.item3'],
    docs: { source: { transform: agentPlanProposedSource } },
  },
  render: () => mount(proposedPlan()),
  play: async ({ canvasElement, step }) => {
    const steps = stepsOf(canvasElement);

    await step('Nada começou: todos os passos estão por fazer', async () => {
      await expect(steps.every((el) => el.dataset.state === 'pending')).toBe(true);
    });

    await step('E o primeiro é o atual, porque é o primeiro que não terminou', async () => {
      // Quem responde "já terminou?" é `isStepFinished`, do vocabulário
      // compartilhado — e não um `if` da tela, que renderia cinco versões da
      // mesma regra, uma delas discordando sobre o passo pulado.
      const current = currentOf(canvasElement);
      await expect(current).toHaveLength(1);
      await expect(current[0]).toBe(steps[0]);
      await expect(isStepFinished('pending')).toBe(false);
    });
  },
};

export const InProgress: Story = {
  parameters: {
    covers: ['functional.item2', 'visual.item4'],
    docs: { source: { transform: agentPlanInProgressSource } },
  },
  render: () => mount(runningPlan()),
  play: async ({ canvasElement, step }) => {
    const steps = stepsOf(canvasElement);

    await step('O passo em curso é o único marcado como atual', async () => {
      const current = currentOf(canvasElement);
      await expect(current).toHaveLength(1);
      await expect(current[0]!.dataset.state).toBe('running');
    });

    await step('E o que já fechou não é o atual, nem o que ainda nem começou', async () => {
      const running = steps.findIndex((el) => el.dataset.state === 'running');
      for (const [index, el] of steps.entries()) {
        await expect(el.hasAttribute('aria-current')).toBe(index === running);
      }
    });
  },
};

export const Finished: Story = {
  parameters: {
    covers: ['functional.item4', 'functional.item5', 'visual.item5'],
    docs: { source: { transform: agentPlanFinishedSource } },
  },
  render: () => mount(finishedPlan()),
  play: async ({ canvasElement, step }) => {
    const steps = stepsOf(canvasElement);
    const labels = agentPlanLabels();

    await step('O passo pulado CONTINUA na lista, na posição em que estava', async () => {
      // Sumir com ele reescreveria o plano depois do fato, e quem lê perderia a
      // informação de que havia outro caminho (decisão 2 da folha).
      const skipped = steps.filter((el) => el.dataset.state === 'skipped');
      await expect(skipped).toHaveLength(1);
      await expect(steps.indexOf(skipped[0]!)).toBe(2);
    });

    await step('E o detalhe dele diz POR QUE não aconteceu', async () => {
      const skipped = steps.find((el) => el.dataset.state === 'skipped')!;
      const detail = skipped.querySelector<HTMLElement>('[data-slot="agent-plan-detail"]')!;
      await expect(detail.textContent?.length).toBeGreaterThan(0);
      const badge = skipped.querySelector<HTMLElement>('[data-slot="agent-plan-state"]')!;
      await expect(badge.textContent).toBe(labels.state.skipped);
    });

    await step('Com tudo terminado, nenhum passo é o atual', async () => {
      // O plano acabou, e não há onde estar. Pulado conta como fim: não
      // aconteceu, e não vai mais.
      await expect(steps.every((el) => isStepFinished(el.dataset.state as never))).toBe(true);
      await expect(currentOf(canvasElement)).toHaveLength(0);
    });
  },
};

export const LongLabel: Story = {
  parameters: {
    covers: ['functional.item7', 'accessibility.item6', 'visual.item8'],
    docs: { source: { transform: agentPlanLongLabelSource } },
  },
  render: () => mount(longLabelPlan()),
  play: async ({ canvasElement, step }) => {
    const label = canvasElement.querySelector<HTMLElement>('[data-slot="agent-plan-label"]')!;

    await step('O rótulo chega INTEIRO ao documento', async () => {
      // O corte nunca acontece em JavaScript: um passo pela metade é uma
      // instrução pela metade (decisão 5 da folha).
      await expect(label.textContent).toBe(longLabelPlan()[0]!.label);
      await expect(label.textContent).not.toContain('…');
    });

    await step('E ele QUEBRA em linhas, em vez de receber reticências', async () => {
      // A leitura é pura: o layout já assentou quando a play começa, e uma
      // sonda que mexesse no DOM dentro de uma espera reagendaria a si mesma.
      const styles = getComputedStyle(label);
      await expect(styles.textOverflow).not.toBe('ellipsis');
      await expect(styles.overflowWrap).toBe('anywhere');

      // Contra o tamanho da fonte, e não contra `line-height`: este último
      // computa `normal` em algumas cascatas, e `parseFloat('normal')` é NaN —
      // comparação com NaN é sempre falsa, e o portão passaria a nunca reprovar.
      const size = parseFloat(styles.fontSize);
      await expect(label.getBoundingClientRect().height).toBeGreaterThan(size * 2);
    });
  },
};

export const Empty: Story = {
  parameters: {
    covers: ['functional.item8'],
    docs: { source: { transform: agentPlanEmptySource } },
  },
  render: () => mount([]),
  play: async ({ canvasElement, step }) => {
    await step('Sem passo nenhum, o plano não existe no documento', async () => {
      // Não é uma lista vazia escondida: é ausência. Uma lista vazia seria
      // anunciada como "lista com zero itens", que promete algo que não há.
      await expect(planOf(canvasElement)).toBeNull();
    });
  },
};
