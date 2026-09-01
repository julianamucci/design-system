import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import { within, userEvent, expect } from 'storybook/test';
import {
  Stepper,
  StepperDescription,
  StepperIndicator,
  StepperItem,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from './index';
import { Button } from '@/components/ui/button';
import { stepperWithDescriptionsSource, stepperWizardSource } from './stepper.source';

const FLOW_LABEL = 'Progresso do cadastro';

const STATE_LABELS = {
  completed: 'Etapa concluída',
  current: 'Etapa atual',
};

// Uma lista só para as duas composições: o que a story renderiza é o que a play
// conta, e duas cópias divergiriam sem ninguém ver.
const WIZARD_STEPS = [
  { step: 1, title: 'Conta', description: 'Seus dados', panel: 'Informe nome, e-mail e senha.' },
  { step: 2, title: 'Endereço', description: 'Onde entregar', panel: 'Informe o endereço de entrega.' },
  { step: 3, title: 'Pagamento', description: 'Forma de pagar', panel: 'Escolha como deseja pagar.' },
  { step: 4, title: 'Revisão', description: 'Confira e envie', panel: 'Confira os dados e finalize.' },
];

const BACK_LABEL = 'Voltar';
const NEXT_LABEL = 'Avançar';

const meta: Meta<any> = {
  title: 'Primitives/Navigation/Stepper/Compositions',
  component: Stepper,
  tags: ['navigation'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: stepperWizardSource },
      description: {
        component:
          'Modos de uso com a fiação por fora: o fluxo completo, em que quem consome guarda a etapa atual e reage à seleção, e as etapas com texto de apoio sob o título.',
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
  StepperDescription,
  StepperSeparator,
  Button,
};

export const Wizard: Story = {
  render: () => ({
    components: sharedComponents,
    setup() {
      const value = ref(1);
      return {
        value,
        steps: WIZARD_STEPS,
        label: FLOW_LABEL,
        labels: STATE_LABELS,
        backLabel: BACK_LABEL,
        nextLabel: NEXT_LABEL,
      };
    },
    template: `
      <div class="nds-stack" data-spacing="md">
        <Stepper :value="value" :aria-label="label" :labels="labels" @step-select="value = $event">
          <StepperItem v-for="item in steps" :key="item.step" :step="item.step">
            <StepperTrigger>
              <StepperIndicator />
              <StepperTitle>{{ item.title }}</StepperTitle>
            </StepperTrigger>
            <StepperSeparator v-if="item.step < steps.length" />
          </StepperItem>
        </Stepper>

        <div class="nds-p-4 nds-rounded-md nds-border-default nds-bg-card nds-stack" data-spacing="sm">
          <h3 class="nds-text-body nds-font-semibold">{{ steps[value - 1].title }}</h3>
          <p class="nds-text-body nds-text-muted-foreground">{{ steps[value - 1].panel }}</p>
        </div>

        <div class="nds-cluster" data-spacing="md">
          <Button variant="outline" :disabled="value === 1" @click="value -= 1">{{ backLabel }}</Button>
          <Button :disabled="value === steps.length" @click="value += 1">{{ nextLabel }}</Button>
        </div>
      </div>
    `,
  }),
  parameters: {
    covers: ['functional.item2', 'visual.item4'],
    docs: {
      description: {
        story: 'Fluxo completo — o indicador acima do painel da etapa, com os controles de voltar e avançar embaixo. A etapa atual é guardada por quem consome, e a seleção chega pelo evento da raiz.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const root = () => canvasElement.querySelector('[data-slot="stepper"]');
    const triggers = () => canvasElement.querySelectorAll<HTMLButtonElement>('[data-slot="stepper-trigger"]');

    // O painel Interactions REEXECUTA a play no mesmo DOM, sem remontar: clique
    // cego partiria do estado que a rodada anterior deixou. Este só clica quando
    // a etapa ainda não é a atual, então cada passo estabelece a própria
    // precondição e o resultado independe da rodada.
    const goToStep = async (index: number) => {
      if (triggers()[index].getAttribute('aria-current') !== 'step') await userEvent.click(triggers()[index]);
    };

    await step('O fluxo começa na primeira etapa', async () => {
      await goToStep(0);
      await expect(root()).toHaveAttribute('data-value', '1');
      await expect(triggers()[0]).toHaveAttribute('aria-current', 'step');
    });

    await step('Selecionar o controle de uma etapa leva o fluxo até ela', async () => {
      await goToStep(2);
      await expect(root()).toHaveAttribute('data-value', '3');
      await expect(triggers()[2]).toHaveAttribute('aria-current', 'step');
      await expect(canvasElement.querySelectorAll('[aria-current]')).toHaveLength(1);
    });

    await step('O painel acompanha a etapa selecionada', async () => {
      await goToStep(2);
      await expect(canvasElement).toHaveTextContent(WIZARD_STEPS[2].panel);
    });

    await step('As etapas anteriores à atual ficam concluídas', async () => {
      await goToStep(2);
      const items = canvasElement.querySelectorAll('[data-slot="stepper-item"]');
      await expect(items[0]).toHaveAttribute('data-state', 'completed');
      await expect(items[1]).toHaveAttribute('data-state', 'completed');
      await expect(items[3]).toHaveAttribute('data-state', 'inactive');
    });

    await step('Voltar recua uma etapa', async () => {
      await goToStep(2);
      await userEvent.click(canvas.getByRole('button', { name: BACK_LABEL }));
      await expect(root()).toHaveAttribute('data-value', '2');
      await expect(canvasElement).toHaveTextContent(WIZARD_STEPS[1].panel);
    });
  },
};

export const WithDescriptions: Story = {
  render: () => ({
    components: sharedComponents,
    setup() {
      return { steps: WIZARD_STEPS, label: FLOW_LABEL, labels: STATE_LABELS };
    },
    template: `
      <Stepper :value="2" :aria-label="label" :labels="labels">
        <StepperItem v-for="item in steps" :key="item.step" :step="item.step">
          <StepperTrigger>
            <StepperIndicator />
            <StepperTitle>{{ item.title }}</StepperTitle>
            <StepperDescription>{{ item.description }}</StepperDescription>
          </StepperTrigger>
          <StepperSeparator v-if="item.step < steps.length" />
        </StepperItem>
      </Stepper>
    `,
  }),
  parameters: {
    docs: {
      source: { transform: stepperWithDescriptionsSource },
      description: {
        story: 'Etapas com texto de apoio sob o título, para quando o nome sozinho não basta. A descrição fica legível para o leitor de tela — só o indicador e o traço saem da árvore de acessibilidade.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Cada etapa traz título e texto de apoio', async () => {
      const titles = canvasElement.querySelectorAll('[data-slot="stepper-title"]');
      const descriptions = canvasElement.querySelectorAll('[data-slot="stepper-description"]');
      await expect(titles).toHaveLength(WIZARD_STEPS.length);
      await expect(descriptions).toHaveLength(WIZARD_STEPS.length);
      await expect(titles[0]).toHaveTextContent(WIZARD_STEPS[0].title);
      await expect(descriptions[0]).toHaveTextContent(WIZARD_STEPS[0].description);
    });

    await step('O texto de apoio entra no nome acessível do controle', async () => {
      const firstTrigger = canvasElement.querySelector('[data-slot="stepper-trigger"]');
      await expect(firstTrigger).not.toHaveAttribute('aria-hidden');
      await expect(firstTrigger).toHaveTextContent(WIZARD_STEPS[0].description);
    });
  },
};
