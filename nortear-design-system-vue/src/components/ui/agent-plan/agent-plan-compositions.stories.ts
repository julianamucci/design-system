import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect } from 'storybook/test';
import { AgentPlan } from './index';
import { AgentStatus } from '@/components/ui/agent-status';
import {
  elapsedOf,
  useAgentStatusLabels,
} from '@/components/ui/agent-status/agent-status.fixtures';
import { proposedPlan, runningPlan, useAgentPlanLabels } from './agent-plan.fixtures';
import {
  agentPlanProposedWithStatusSource,
  agentPlanTaskListSource,
} from './agent-plan.source';
import type { PlanStep, RunStatus } from '@shared/primitives/chat-protocol';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// OS DOIS USOS DA MESMA PEÇA, um em cada story.
//
// O plano PROPOSTO aparece antes de agir, e responde "é isto que vou fazer?". A
// LISTA DE TAREFAS fica de pé durante o trabalho, e responde "onde estamos?". O
// desenho, os estados e o vocabulário são os mesmos nos dois — o que muda é
// quando a lista aparece e quem a propôs, e isso é política de produto, não
// forma. Duas peças aqui seriam duas páginas para uma coisa só.

const meta: Meta = {
  title: 'Components/Conversational/AgentPlan/Compositions',
  tags: ['conversational'],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: agentPlanProposedWithStatusSource },
      description: {
        component:
          'A mesma peça serve o plano proposto antes de agir e a lista de tarefas mantida durante — o que muda é quando ela aparece.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/**
 * A linha de estado e o plano, empilhados.
 *
 * As duas peças são IRMÃS: nenhuma é prop da outra, e nenhum arquivo de uma sabe
 * que a outra existe. Quem consome as monta lado a lado, nesta ordem — a linha
 * diz em que pé está a resposta, e o plano detalha os passos dentro dela.
 */
const mount = (status: RunStatus, steps: PlanStep[]) => ({
  components: { AgentPlan, AgentStatus },
  setup() {
    return {
      status,
      steps,
      elapsed: elapsedOf(status),
      statusLabels: useAgentStatusLabels(),
      labels: useAgentPlanLabels(),
    };
  },
  template: `<div class="nds-stack nds-max-w-lg" data-spacing="sm">
    <AgentStatus :status="status" :elapsed="elapsed" :labels="statusLabels" />
    <AgentPlan :steps="steps" :labels="labels" />
  </div>`,
});

const planOf = (canvasElement: HTMLElement) =>
  canvasElement.querySelector<HTMLElement>('[data-slot="agent-plan"]')!;

const stepsOf = (canvasElement: HTMLElement) => [
  ...canvasElement.querySelectorAll<HTMLElement>('[data-slot="agent-plan-step"]'),
];

/**
 * O PLANO PROPOSTO, antes de agir.
 *
 * Nada começou: a linha acima está em espera e todos os passos estão por fazer.
 * É a pergunta "é isto que vou fazer?" desenhada.
 */
export const ProposedPlan: Story = {
  parameters: { covers: ['visual.item6'] },
  render: () => mount('idle', proposedPlan()),
  play: async ({ canvasElement, step }) => {
    const plan = planOf(canvasElement);
    const line = canvasElement.querySelector<HTMLElement>('[data-slot="agent-status"]')!;

    await step('O plano fica FORA da linha de estado, e depois dela', async () => {
      // A linha fala da execução inteira; o plano detalha os passos dentro
      // dela. Uma dentro da outra faria o plano parecer parte da frase.
      await expect(line.contains(plan)).toBe(false);
      await expect(
        line.compareDocumentPosition(plan) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    });

    await step('Nada começou, e o primeiro passo é por onde isto começa', async () => {
      const steps = stepsOf(canvasElement);
      await expect(steps.every((el) => el.dataset.state === 'pending')).toBe(true);
      await expect(steps[0]!.getAttribute('aria-current')).toBe('step');
    });
  },
};

/**
 * A LISTA DE TAREFAS, mantida durante o trabalho.
 *
 * Mesma peça, mesmos rótulos, mesma tag: o que muda é a lista que chega e o
 * estado da linha acima. É a decisão de não criar um segundo componente,
 * escrita em código.
 */
export const TaskList: Story = {
  parameters: {
    covers: ['visual.item7'],
    docs: { source: { transform: agentPlanTaskListSource } },
  },
  render: () => mount('running', runningPlan()),
  play: async ({ canvasElement, step }) => {
    const plan = planOf(canvasElement);
    const steps = stepsOf(canvasElement);

    await step('É a MESMA lista do plano proposto — mesma classe, mesma árvore', async () => {
      await expect(plan.tagName).toBe('OL');
      await expect(plan.classList.contains('nds-agent-plan')).toBe(true);
    });

    await step('O que muda é o que já saiu, e onde estamos agora', async () => {
      await expect(steps.some((el) => el.dataset.state === 'done')).toBe(true);
      const current = canvasElement.querySelectorAll('[aria-current="step"]');
      await expect(current).toHaveLength(1);
      await expect((current[0] as HTMLElement).dataset.state).toBe('running');
    });

    await step('E a lista continua fora de qualquer região viva', async () => {
      // Ela muda passo a passo enquanto a resposta é gerada; narrar cada troca
      // é a mesma armadilha do relógio da linha acima.
      await expect(plan.closest('[aria-live]')).toBeNull();
      await expect(plan.querySelector('[aria-live]')).toBeNull();
    });
  },
};
