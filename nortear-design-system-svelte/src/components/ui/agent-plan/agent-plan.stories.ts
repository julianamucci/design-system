import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { expect, within } from 'storybook/test';
import AgentPlanStory from './AgentPlanStory.svelte';
import { SAMPLE_DETAIL, SAMPLE_STEP, agentPlanLabels } from './agent-plan.fixtures';
import { agentPlanSource } from './agent-plan.source';
import { PLAN_STEP_STATES, type PlanStepState } from '@shared/primitives/chat-protocol';
import AgentPlanDocs from '@/components/docs/AgentPlanDocs.svelte';
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

// O docgen do Svelte está desligado no .storybook/main.ts: a aba
// "API Reference" sai só destes argTypes.
const meta: Meta<PlaygroundArgs> = {
  title: 'Components/Conversational/AgentPlan',
  component: AgentPlanStory,
  tags: ['autodocs', 'conversational'],
  parameters: {
    layout: 'padded',
    actions: { disable: true },
    docs: {
      page: withAutoDocsTab(AgentPlanDocs),
      // Sem docgen, o gerador de source monta a tag a partir do nome interno da
      // função compilada. A transform devolve o uso real.
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
  render: (args) => ({
    Component: AgentPlanStory,
    props: { ...args },
  }),
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
