import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { tick } from 'svelte';
import { fn, userEvent, within, expect } from 'storybook/test';
import StepperStory from './StepperStory.svelte';
import {
  stepperDisabledSource,
  stepperForcedCompletedSource,
  stepperInactiveSource,
  stepperSource,
} from './stepper.source';

const meta: Meta = {
  title: 'Primitives/Navigation/Stepper/States',
  component: StepperStory,
  tags: ['navigation'],
  parameters: {
    // Sem `argTypes` nesta meta: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // Cascateia para todas as stories do arquivo; cada uma sobrescreve com a
      // sua própria composição logo abaixo.
      source: { transform: stepperSource },
    },
  },
};

export default meta;
type Story = StoryObj;

const FLOW_LABEL = 'Progresso do cadastro';
const LABELS = { completed: 'Etapa concluída', current: 'Etapa atual' };

const STEPS = [
  { step: 1, title: 'Conta' },
  { step: 2, title: 'Endereço' },
  { step: 3, title: 'Pagamento' },
  { step: 4, title: 'Revisão' },
];

/** Quarta etapa concluída fora de ordem — o fluxo aceita ordem fora do comum. */
const STEPS_FORCED_COMPLETED = [
  { step: 1, title: 'Conta' },
  { step: 2, title: 'Endereço' },
  { step: 3, title: 'Pagamento' },
  { step: 4, title: 'Revisão', completed: true },
];

const STEPS_DISABLED = [
  { step: 1, title: 'Conta' },
  { step: 2, title: 'Endereço' },
  { step: 3, title: 'Pagamento', disabled: true },
  { step: 4, title: 'Revisão', disabled: true },
];

const itemAt = (root: HTMLElement, step: number): HTMLElement =>
  root.querySelector<HTMLElement>(`[data-slot="stepper-item"][data-step="${step}"]`)!;

const triggerOf = (item: HTMLElement): HTMLButtonElement =>
  item.querySelector<HTMLButtonElement>('[data-slot="stepper-trigger"]')!;

const indicatorOf = (item: HTMLElement): HTMLElement =>
  item.querySelector<HTMLElement>('[data-slot="stepper-indicator"]')!;

export const Inactive: Story = {
  render: () => ({
    Component: StepperStory,
    props: { steps: STEPS, value: 1, ariaLabel: FLOW_LABEL, labels: LABELS },
  }),
  parameters: {
    docs: {
      source: { transform: stepperInactiveSource },
      description: {
        story:
          'Etapa ainda não alcançada: círculo neutro com o número da etapa, sem marca de ' +
          'verificação e sem palavra de estado — nada a anunciar até que o fluxo chegue nela.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('As etapas depois da atual ficam inativas', async () => {
      for (const n of [2, 3, 4]) {
        await expect(itemAt(canvasElement, n)).toHaveAttribute('data-state', 'inactive');
      }
    });

    await step('O indicador da etapa inativa mostra o número, não a marca', async () => {
      const indicator = indicatorOf(itemAt(canvasElement, 3));
      await expect(indicator).toHaveTextContent('3');
      await expect(indicator.querySelector('svg')).toBeNull();
    });

    await step('Nenhuma delas se anuncia como atual nem carrega palavra de estado', async () => {
      for (const n of [2, 3, 4]) {
        const trigger = triggerOf(itemAt(canvasElement, n));
        await expect(trigger).not.toHaveAttribute('aria-current');
        await expect(
          trigger.querySelector('[data-slot="stepper-state-label"]'),
        ).toHaveTextContent('');
      }
    });
  },
};

export const Active: Story = {
  render: () => ({
    Component: StepperStory,
    props: { steps: STEPS, value: 2, ariaLabel: FLOW_LABEL, labels: LABELS },
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Etapa atual: círculo no primário e aria-current="step" no controle — o token que a ' +
          'WAI-ARIA define para posição num processo, e não o "true" genérico.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('A etapa igual ao valor do fluxo é a atual', async () => {
      await expect(itemAt(canvasElement, 2)).toHaveAttribute('data-state', 'active');
    });

    await step('O controle dela é o único marcado como etapa atual', async () => {
      await expect(triggerOf(itemAt(canvasElement, 2))).toHaveAttribute('aria-current', 'step');
      await expect(
        Array.from(canvasElement.querySelectorAll('[aria-current="step"]')),
      ).toHaveLength(1);
    });

    await step('E o destaque não é só de cor: a palavra de estado acompanha', async () => {
      await expect(
        triggerOf(itemAt(canvasElement, 2)).querySelector('[data-slot="stepper-state-label"]'),
      ).toHaveTextContent(LABELS.current);
    });
  },
};

export const Completed: Story = {
  render: () => ({
    Component: StepperStory,
    props: {
      steps: STEPS_FORCED_COMPLETED,
      value: 2,
      ariaLabel: FLOW_LABEL,
      labels: LABELS,
    },
  }),
  parameters: {
    covers: ['functional.item4', 'visual.item2'],
    docs: {
      source: { transform: stepperForcedCompletedSource },
      description: {
        story:
          'Etapa concluída: o número dá lugar a uma marca de verificação, e o traço até a ' +
          'próxima etapa acompanha a cor. A quarta etapa está marcada como concluída mesmo ' +
          'vindo depois da atual — é o que um fluxo de ordem livre precisa.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('A etapa anterior à atual chega a concluída por comparação', async () => {
      await expect(itemAt(canvasElement, 1)).toHaveAttribute('data-state', 'completed');
    });

    await step('A etapa marcada como concluída vale mesmo vindo depois da atual', async () => {
      const forced = itemAt(canvasElement, 4);
      await expect(forced).toHaveAttribute('data-completed', '');
      await expect(forced).toHaveAttribute('data-state', 'completed');
    });

    await step('O indicador troca o número por uma marca de verificação', async () => {
      // Forma, e não matiz: sobrevive a daltonismo e a tela monocromática.
      const indicator = indicatorOf(itemAt(canvasElement, 4));
      await expect(indicator.querySelector('svg')).not.toBeNull();
      await expect(indicator).not.toHaveTextContent('4');
    });

    await step('E quem não vê a marca ouve a palavra de estado', async () => {
      await expect(
        triggerOf(itemAt(canvasElement, 4)).querySelector('[data-slot="stepper-state-label"]'),
      ).toHaveTextContent(LABELS.completed);
    });

    await step('A etapa 3 continua inativa, entre uma concluída e outra', async () => {
      await expect(itemAt(canvasElement, 3)).toHaveAttribute('data-state', 'inactive');
      await expect(indicatorOf(itemAt(canvasElement, 3))).toHaveTextContent('3');
    });
  },
};

export const Disabled: Story = {
  args: { onStepSelect: fn() },
  render: (args) => ({
    Component: StepperStory,
    props: {
      steps: STEPS_DISABLED,
      value: 2,
      ariaLabel: FLOW_LABEL,
      labels: LABELS,
      onStepSelect: args.onStepSelect,
    },
  }),
  parameters: {
    covers: ['functional.item3', 'accessibility.item5', 'visual.item3'],
    docs: {
      source: { transform: stepperDisabledSource },
      description: {
        story:
          'Etapa indisponível: o controle sai da ordem de tabulação em vez de virar uma parada ' +
          'de foco sem destino, e o item deixa de responder ao ponteiro.',
      },
    },
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const onStepSelect = args.onStepSelect as ReturnType<typeof fn>;
    const available = triggerOf(itemAt(canvasElement, 2));
    const blocked = triggerOf(itemAt(canvasElement, 3));

    await step('O item se declara indisponível e o controle é desabilitado de verdade', async () => {
      await expect(itemAt(canvasElement, 3)).toHaveAttribute('data-disabled', '');
      await expect(blocked).toBeDisabled();
    });

    await step('O controle indisponível está fora da ordem de tabulação', async () => {
      // Um botão focável que não leva a lugar nenhum gasta o tempo de quem
      // navega por teclado sem entregar nada.
      available.focus();
      await userEvent.tab();
      await expect(blocked).not.toHaveFocus();
      await expect(triggerOf(itemAt(canvasElement, 4))).not.toHaveFocus();
    });

    await step('E a seleção não dispara nem pelo ponteiro', async () => {
      onStepSelect.mockClear();
      // `pointerEventsCheck: 0` é obrigatório: com `pointer-events: none` o
      // userEvent RECUSA o clique e o teste passaria sem exercitar nada.
      await userEvent.click(blocked, { pointerEventsCheck: 0 });
      await tick();
      await expect(onStepSelect).not.toHaveBeenCalled();
      await expect(itemAt(canvasElement, 2)).toHaveAttribute('data-state', 'active');
    });

    await step('A etapa disponível continua respondendo', async () => {
      onStepSelect.mockClear();
      await userEvent.click(canvas.getByRole('button', { name: /Conta/ }));
      await tick();
      await expect(onStepSelect).toHaveBeenCalledWith(1);
      // Devolve o fluxo ao valor de montagem: o painel Interactions reexecuta a
      // play no mesmo DOM.
      await userEvent.click(available);
      await tick();
      await expect(itemAt(canvasElement, 2)).toHaveAttribute('data-state', 'active');
    });
  },
};
