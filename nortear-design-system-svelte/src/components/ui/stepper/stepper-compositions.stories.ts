import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { tick } from 'svelte';
import { fn, userEvent, within, expect } from 'storybook/test';
import StepperStory from './StepperStory.svelte';
import StepperWizardStory from './StepperWizardStory.svelte';
import {
  stepperSource,
  stepperWithDescriptionsSource,
  stepperWizardSource,
} from './stepper.source';

const meta: Meta = {
  title: 'Components/Navigation/Stepper/Compositions',
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
const BACK_LABEL = 'Voltar';
const NEXT_LABEL = 'Avançar';
const INITIAL_STEP = 2;

const DESCRIBED_STEPS = [
  { step: 1, title: 'Conta', description: 'Seus dados' },
  { step: 2, title: 'Endereço', description: 'Onde entregar' },
  { step: 3, title: 'Pagamento', description: 'Forma de pagar' },
  { step: 4, title: 'Revisão', description: 'Confira e envie' },
];

const itemAt = (root: HTMLElement, step: number): HTMLElement =>
  root.querySelector<HTMLElement>(`[data-slot="stepper-item"][data-step="${step}"]`)!;

const triggerOf = (item: HTMLElement): HTMLButtonElement =>
  item.querySelector<HTMLButtonElement>('[data-slot="stepper-trigger"]')!;

export const Wizard: Story = {
  args: { onStepSelect: fn() },
  render: (args) => ({
    Component: StepperWizardStory,
    props: {
      value: INITIAL_STEP,
      ariaLabel: FLOW_LABEL,
      labels: LABELS,
      backLabel: BACK_LABEL,
      nextLabel: NEXT_LABEL,
      onStepSelect: args.onStepSelect,
    },
  }),
  parameters: {
    covers: ['functional.item2', 'visual.item4'],
    docs: {
      source: { transform: stepperWizardSource },
      description: {
        story:
          'Fluxo completo: o indicador acima do painel da etapa, com os controles de voltar e ' +
          'avançar embaixo. O Stepper não tem região viva, então quem anuncia o avanço é o ' +
          'painel que trocou de conteúdo — e é para ele que esta composição move o foco.',
      },
    },
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const onStepSelect = args.onStepSelect as ReturnType<typeof fn>;

    /**
     * Precondição de CADA passo, e não herança do anterior: o painel Interactions
     * reexecuta a play no mesmo DOM.
     */
    const resetFlow = async () => {
      const item = itemAt(canvasElement, INITIAL_STEP);
      if (item.dataset.state !== 'active') {
        await userEvent.click(triggerOf(item));
        await tick();
      }
    };

    await step('O painel mostra a etapa em que o fluxo está', async () => {
      await resetFlow();
      await expect(canvas.getByRole('heading', { level: 3 })).toHaveTextContent('Endereço');
    });

    await step('Selecionar uma etapa entrega o número dela ao callback', async () => {
      await resetFlow();
      onStepSelect.mockClear();
      await userEvent.click(triggerOf(itemAt(canvasElement, 3)));
      await tick();
      await expect(onStepSelect).toHaveBeenCalledWith(3);
      await expect(itemAt(canvasElement, 3)).toHaveAttribute('data-state', 'active');
      await expect(canvas.getByRole('heading', { level: 3 })).toHaveTextContent('Pagamento');
    });

    await step('Avançar move uma etapa e leva o foco ao painel', async () => {
      await resetFlow();
      const panel = canvas.getByRole('heading', { level: 3 }).parentElement!;
      await userEvent.click(canvas.getByRole('button', { name: NEXT_LABEL }));
      await tick();
      await expect(itemAt(canvasElement, 3)).toHaveAttribute('data-state', 'active');
      // É o painel que anuncia o avanço, e por isso é ele que recebe o foco.
      await expect(panel).toHaveFocus();
    });

    await step('Voltar desfaz um passo, e a etapa deixada para trás fica concluída', async () => {
      await resetFlow();
      await userEvent.click(canvas.getByRole('button', { name: BACK_LABEL }));
      await tick();
      await expect(itemAt(canvasElement, 1)).toHaveAttribute('data-state', 'active');
      await expect(itemAt(canvasElement, 2)).toHaveAttribute('data-state', 'inactive');
    });

    await step('Na primeira etapa, voltar não tem para onde ir', async () => {
      const item = itemAt(canvasElement, 1);
      if (item.dataset.state !== 'active') {
        await userEvent.click(triggerOf(item));
        await tick();
      }
      await expect(canvas.getByRole('button', { name: BACK_LABEL })).toBeDisabled();
      await resetFlow();
    });
  },
};

export const WithDescriptions: Story = {
  render: () => ({
    Component: StepperStory,
    props: {
      steps: DESCRIBED_STEPS,
      value: INITIAL_STEP,
      ariaLabel: FLOW_LABEL,
      labels: LABELS,
    },
  }),
  parameters: {
    docs: {
      source: { transform: stepperWithDescriptionsSource },
      description: {
        story:
          'Etapas com texto de apoio sob o título, para quando o nome sozinho não basta. A ' +
          'descrição é conteúdo, não decoração: entra no nome acessível do controle junto com ' +
          'o título.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Cada etapa traz título e texto de apoio', async () => {
      const descriptions = Array.from(
        canvasElement.querySelectorAll<HTMLElement>('[data-slot="stepper-description"]'),
      );
      await expect(descriptions).toHaveLength(DESCRIBED_STEPS.length);
      for (const [index, description] of descriptions.entries()) {
        await expect(description).toHaveTextContent(DESCRIBED_STEPS[index].description);
      }
    });

    await step('O texto de apoio entra no nome acessível do controle', async () => {
      // Diferente do indicador e do traço, a descrição NÃO leva aria-hidden.
      const trigger = canvas.getByRole('button', { name: /Endereço/ });
      await expect(trigger).toHaveAccessibleName(/Onde entregar/);
    });

    await step('E a etapa atual continua sendo a única marcada', async () => {
      await expect(
        Array.from(canvasElement.querySelectorAll('[aria-current="step"]')),
      ).toHaveLength(1);
      await expect(
        canvasElement.querySelector('[aria-current="step"]')!.closest('[data-slot="stepper-item"]'),
      ).toHaveAttribute('data-step', String(INITIAL_STEP));
    });
  },
};
