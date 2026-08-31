import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect, within } from 'storybook/test';
import { createAgentPlan } from './agent-plan';
import { SAMPLE_DETAIL, SAMPLE_STEP, agentPlanLabels } from './agent-plan.fixtures';
import { agentPlanSource } from './agent-plan.source';
import { PLAN_STEP_STATES, type PlanStepState } from '@shared/primitives/chat-protocol';
import { createAgentPlanDocs } from '@/components/docs/AgentPlanDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

/**
 * Os três eixos de um passo, num passo só.
 *
 * O estado decide a palavra e o marcador; o rótulo é o que se faz; o detalhe é
 * o que o rótulo não diz. A grade dos cinco estados mora em `States`; aqui o
 * assunto é o que muda quando se mexe em cada eixo.
 */
type PlaygroundArgs = {
  state: PlanStepState;
  label: string;
  detail: string;
};

const meta: Meta<PlaygroundArgs> = {
  title: 'Primitives/Conversational/AgentPlan',
  tags: ['autodocs', 'conversational'],
  parameters: {
    layout: 'padded',
    actions: { disable: true },
    docs: {
      page: withAutoDocsTab(createAgentPlanDocs),
      source: { transform: agentPlanSource },
    },
  },
  argTypes: {
    state: {
      control: 'select',
      options: [...PLAN_STEP_STATES],
      description:
        'Em que pé está o passo. Decide a palavra, o marcador e quem é o passo atual.',
      table: {
        type: { summary: PLAN_STEP_STATES.map((item) => `'${item}'`).join(' | ') },
        defaultValue: { summary: '—' },
      },
    },
    label: {
      control: 'text',
      description:
        'O que se faz naquele passo, por extenso. Quebra em linhas, e nunca é cortado.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '—' } },
    },
    detail: {
      control: 'text',
      description:
        'O motivo, o resultado ou a falha — o que couber ao estado. Ocupa a linha de baixo.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '—' } },
    },
  },
  args: {
    state: 'running',
    label: SAMPLE_STEP,
    detail: SAMPLE_DETAIL,
  },
};

export default meta;
type Story = StoryObj<PlaygroundArgs>;

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item6',
      'accessibility.item1', 'accessibility.item2',
      'accessibility.item3', 'accessibility.item5',
      'visual.item1',
    ],
  },
  render: (args) => {
    const plan = createAgentPlan({
      labels: agentPlanLabels(),
      steps: [
        {
          id: 's1',
          label: args.label,
          state: args.state,
          // Campo de texto vazio é ausência de detalhe, e não um detalhe em
          // branco: uma string vazia desenharia uma linha sem nada nela.
          detail: args.detail || undefined,
        },
      ],
    });

    // A fábrica devolve nada quando não há passo nenhum, e o renderer html pede
    // um elemento — então a ausência precisa de um lugar onde caber.
    const host = document.createElement('div');
    if (plan) host.appendChild(plan);
    return host;
  },
  play: async ({ canvasElement, step, args }) => {
    const plan = canvasElement.querySelector<HTMLElement>('[data-slot="agent-plan"]')!;
    const first = plan.querySelector<HTMLElement>('[data-slot="agent-plan-step"]')!;
    const labels = agentPlanLabels();

    await step('A lista é ordenada de verdade, e tem nome', async () => {
      // A ordem É a informação: quem ouve quer saber que está no terceiro de
      // cinco, e uma lista não ordenada anuncia quantos itens há sem dizer em
      // que lugar cada um está (decisão 1 da folha).
      await expect(plan.tagName).toBe('OL');
      await expect(plan.getAttribute('aria-label')).toBe(labels.plan);
    });

    await step('A lista NÃO é região viva', async () => {
      // O plano anda passo a passo enquanto a resposta é gerada logo ao lado, e
      // narrar cada troca corta a leitura do que importa (decisão 4 da folha).
      await expect(plan.hasAttribute('aria-live')).toBe(false);
      await expect(plan.hasAttribute('role')).toBe(false);
      await expect(plan.querySelector('[aria-live]')).toBeNull();
      await expect(plan.querySelector('[role="status"], [role="alert"], [role="log"]')).toBeNull();
    });

    await step('O passo traz a PALAVRA do estado escolhido', async () => {
      // O marcador é forma e cor, e nenhuma das duas descreve estado sozinha
      // (WCAG 1.4.1, decisão 3 da folha).
      await expect(first.dataset.state).toBe(args.state);
      const badge = first.querySelector<HTMLElement>('[data-slot="agent-plan-state"]')!;
      await expect(badge.textContent).toBe(labels.state[args.state]);
    });

    await step('E o marcador fica FORA do que é lido em voz', async () => {
      const marker = first.querySelector<HTMLElement>('[data-slot="agent-plan-marker"]')!;
      await expect(marker.getAttribute('aria-hidden')).toBe('true');
      await expect(marker.textContent).toBe('');
    });

    await step('O rótulo aparece inteiro, e o detalhe na linha de baixo', async () => {
      const label = first.querySelector<HTMLElement>('[data-slot="agent-plan-label"]')!;
      await expect(label.textContent).toBe(args.label);
      await expect(within(canvasElement).queryByText(args.label)).toBeInTheDocument();

      const detail = first.querySelector<HTMLElement>('[data-slot="agent-plan-detail"]');
      await expect(detail?.textContent ?? '').toBe(args.detail);
    });
  },
};
