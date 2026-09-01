import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { fn, userEvent, expect } from 'storybook/test';
import {
  Stepper,
  StepperIndicator,
  StepperItem,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from './index';
import {
  stepperActiveSource,
  stepperCompletedSource,
  stepperDisabledSource,
  stepperInactiveSource,
} from './stepper.source';

const FLOW_LABEL = 'Progresso do cadastro';

const STATE_LABELS = {
  completed: 'Etapa concluída',
  current: 'Etapa atual',
};

// Espião do fluxo indisponível: a etapa desabilitada não pode chamá-lo, e é
// isso que a story de Disabled cobra.
const onStepSelect = fn();

const meta: Meta<any> = {
  title: 'Primitives/Navigation/Stepper/States',
  component: Stepper,
  tags: ['navigation'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // A do `meta` cascateia; cada story cujo assunto é outro estado declara a
      // sua, e ela vence.
      source: { transform: stepperInactiveSource },
      description: {
        component:
          'Situações em que uma etapa cai: ainda não alcançada, atual, concluída e indisponível. O estado sai da comparação entre o número da etapa e o valor do fluxo — só a etapa concluída fora de ordem e a indisponível são marcadas à mão.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const sharedComponents = {
  Stepper,
  StepperItem,
  StepperTrigger,
  StepperIndicator,
  StepperTitle,
  StepperSeparator,
};

const sharedSetup = () => ({ label: FLOW_LABEL, labels: STATE_LABELS });

export const Inactive: Story = {
  render: () => ({
    components: sharedComponents,
    setup: sharedSetup,
    template: `
      <Stepper :value="1" :aria-label="label" :labels="labels">
        <StepperItem :step="1">
          <StepperTrigger>
            <StepperIndicator />
            <StepperTitle>Conta</StepperTitle>
          </StepperTrigger>
          <StepperSeparator />
        </StepperItem>
        <StepperItem :step="2">
          <StepperTrigger>
            <StepperIndicator />
            <StepperTitle>Endereço</StepperTitle>
          </StepperTrigger>
          <StepperSeparator />
        </StepperItem>
        <StepperItem :step="3">
          <StepperTrigger>
            <StepperIndicator />
            <StepperTitle>Pagamento</StepperTitle>
          </StepperTrigger>
        </StepperItem>
      </Stepper>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story: 'Ainda não alcançada — a etapa depois da atual mostra o número em círculo neutro, sem aria-current e sem palavra de estado.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('As etapas depois da atual ficam em inactive', async () => {
      const items = canvasElement.querySelectorAll('[data-slot="stepper-item"]');
      await expect(items[1]).toHaveAttribute('data-state', 'inactive');
      await expect(items[2]).toHaveAttribute('data-state', 'inactive');
    });

    await step('A etapa não alcançada mostra o número e não é a atual', async () => {
      const third = canvasElement.querySelectorAll('[data-slot="stepper-item"]')[2];
      await expect(third.querySelector('[data-slot="stepper-indicator"]')).toHaveTextContent('3');
      await expect(third.querySelector('[data-slot="stepper-indicator"] svg')).toBeNull();
      await expect(third.querySelector('[data-slot="stepper-trigger"]')).not.toHaveAttribute('aria-current');
      // Texto vazio se afere pelo conteúdo, não por `toHaveTextContent('')` —
      // o jest-dom recusa a string vazia porque ela casaria com tudo.
      await expect(third.querySelector('[data-slot="stepper-state-label"]')?.textContent?.trim()).toBe('');
    });
  },
};

export const Active: Story = {
  render: () => ({
    components: sharedComponents,
    setup: sharedSetup,
    template: `
      <Stepper :value="2" :aria-label="label" :labels="labels">
        <StepperItem :step="1">
          <StepperTrigger>
            <StepperIndicator />
            <StepperTitle>Conta</StepperTitle>
          </StepperTrigger>
          <StepperSeparator />
        </StepperItem>
        <StepperItem :step="2">
          <StepperTrigger>
            <StepperIndicator />
            <StepperTitle>Endereço</StepperTitle>
          </StepperTrigger>
          <StepperSeparator />
        </StepperItem>
        <StepperItem :step="3">
          <StepperTrigger>
            <StepperIndicator />
            <StepperTitle>Pagamento</StepperTitle>
          </StepperTrigger>
        </StepperItem>
      </Stepper>
    `,
  }),
  parameters: {
    docs: {
      source: { transform: stepperActiveSource },
      description: {
        story: 'Etapa atual — círculo no primário, aria-current="step" no controle e a palavra de estado no rótulo lido só por leitor de tela.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('A etapa igual ao valor do fluxo é a atual', async () => {
      const second = canvasElement.querySelectorAll('[data-slot="stepper-item"]')[1];
      await expect(second).toHaveAttribute('data-state', 'active');
      await expect(second.querySelector('[data-slot="stepper-trigger"]')).toHaveAttribute('aria-current', 'step');
      await expect(second.querySelector('[data-slot="stepper-state-label"]')).toHaveTextContent(STATE_LABELS.current);
    });

    await step('Nenhuma outra etapa se anuncia como atual', async () => {
      await expect(canvasElement.querySelectorAll('[aria-current]')).toHaveLength(1);
    });
  },
};

export const Completed: Story = {
  render: () => ({
    components: sharedComponents,
    setup: sharedSetup,
    template: `
      <Stepper :value="1" :aria-label="label" :labels="labels">
        <StepperItem :step="1">
          <StepperTrigger>
            <StepperIndicator />
            <StepperTitle>Conta</StepperTitle>
          </StepperTrigger>
          <StepperSeparator />
        </StepperItem>
        <StepperItem :step="2">
          <StepperTrigger>
            <StepperIndicator />
            <StepperTitle>Endereço</StepperTitle>
          </StepperTrigger>
          <StepperSeparator />
        </StepperItem>
        <StepperItem :step="3" completed>
          <StepperTrigger>
            <StepperIndicator />
            <StepperTitle>Pagamento</StepperTitle>
          </StepperTrigger>
        </StepperItem>
      </Stepper>
    `,
  }),
  parameters: {
    covers: ['functional.item4', 'visual.item2'],
    docs: {
      source: { transform: stepperCompletedSource },
      description: {
        story: 'Concluída — a terceira etapa é marcada como concluída mesmo estando depois da atual: o número dá lugar à marca de verificação, e o traço que sai dela acompanha a cor.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('A etapa marcada como concluída conta como concluída mesmo depois da atual', async () => {
      const third = canvasElement.querySelectorAll('[data-slot="stepper-item"]')[2];
      await expect(third).toHaveAttribute('data-completed', '');
      await expect(third).toHaveAttribute('data-state', 'completed');
    });

    await step('A marca de verificação toma o lugar do número', async () => {
      const third = canvasElement.querySelectorAll('[data-slot="stepper-item"]')[2];
      const indicator = third.querySelector('[data-slot="stepper-indicator"]');
      await expect(indicator?.querySelector('svg')).not.toBeNull();
      await expect(indicator).not.toHaveTextContent('3');
    });

    await step('A palavra de estado acompanha a marca, para quem não a vê', async () => {
      const third = canvasElement.querySelectorAll('[data-slot="stepper-item"]')[2];
      await expect(third.querySelector('[data-slot="stepper-state-label"]')).toHaveTextContent(STATE_LABELS.completed);
    });
  },
};

export const Disabled: Story = {
  render: () => ({
    components: sharedComponents,
    setup: () => ({ label: FLOW_LABEL, labels: STATE_LABELS, onStepSelect }),
    template: `
      <Stepper :value="1" :aria-label="label" :labels="labels" @step-select="onStepSelect">
        <StepperItem :step="1">
          <StepperTrigger>
            <StepperIndicator />
            <StepperTitle>Conta</StepperTitle>
          </StepperTrigger>
          <StepperSeparator />
        </StepperItem>
        <StepperItem :step="2">
          <StepperTrigger>
            <StepperIndicator />
            <StepperTitle>Endereço</StepperTitle>
          </StepperTrigger>
          <StepperSeparator />
        </StepperItem>
        <StepperItem :step="3" disabled>
          <StepperTrigger>
            <StepperIndicator />
            <StepperTitle>Pagamento</StepperTitle>
          </StepperTrigger>
        </StepperItem>
      </Stepper>
    `,
  }),
  parameters: {
    covers: ['functional.item3', 'accessibility.item5', 'visual.item3'],
    docs: {
      source: { transform: stepperDisabledSource },
      description: {
        story: 'Indisponível — a etapa que ainda não pode ser aberta sai da ordem de tabulação e o ponteiro não a alcança, em vez de virar uma parada de foco sem destino.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('A etapa indisponível marca o item e desabilita o controle', async () => {
      const third = canvasElement.querySelectorAll('[data-slot="stepper-item"]')[2];
      await expect(third).toHaveAttribute('data-disabled', '');
      await expect(third.querySelector('[data-slot="stepper-trigger"]')).toBeDisabled();
    });

    await step('O controle indisponível não recebe foco', async () => {
      const trigger = canvasElement.querySelectorAll('[data-slot="stepper-trigger"]')[2] as HTMLButtonElement;
      trigger.focus();
      await expect(trigger).not.toHaveFocus();
    });

    await step('Acionar a etapa indisponível não seleciona nada', async () => {
      const trigger = canvasElement.querySelectorAll('[data-slot="stepper-trigger"]')[2] as HTMLButtonElement;
      await userEvent.click(trigger, { pointerEventsCheck: 0 });
      await expect(onStepSelect).not.toHaveBeenCalled();
    });
  },
};
