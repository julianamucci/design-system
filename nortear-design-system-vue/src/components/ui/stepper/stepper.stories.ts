import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { fn, within, expect } from 'storybook/test';
import {
  Stepper,
  StepperDescription,
  StepperIndicator,
  StepperItem,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from './index';
import StepperDocs from '@/components/docs/StepperDocs.vue';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { stepperSource } from './stepper.source';

// Massa do fluxo. Uma constante só, porque a mesma lista é o que a story
// renderiza e o que a play conta — duas cópias divergiriam em silêncio.
const FLOW_STEPS = [
  { step: 1, title: 'Conta', description: 'Seus dados' },
  { step: 2, title: 'Endereço', description: 'Onde entregar' },
  { step: 3, title: 'Pagamento', description: 'Forma de pagar' },
  { step: 4, title: 'Revisão', description: 'Confira e envie' },
];

const FLOW_LABEL = 'Progresso do cadastro';

const STATE_LABELS = {
  completed: 'Etapa concluída',
  current: 'Etapa atual',
};

const meta: Meta<any> = {
  title: 'Primitives/Navigation/Stepper',
  component: Stepper,
  tags: ['autodocs', 'navigation'],
  parameters: {
    docs: {
      page: withAutoDocsTab(StepperDocs),
      source: { transform: stepperSource },
      description: {
        component:
          'Stepper indica a posição em um fluxo sequencial. A raiz é uma lista ordenada, cada etapa é um item com estado derivado do valor atual (concluída, atual, ainda não alcançada) e o controle da etapa atual carrega aria-current="step". A etapa concluída troca o número por uma marca de verificação e ganha um rótulo só para leitor de tela — o estado nunca depende só de cor. Não há região viva: quem anuncia o avanço é o painel que trocou de conteúdo.',
      },
    },
  },
  argTypes: {
    value: {
      control: { type: 'number', min: 1, max: 4 },
      description: 'Número da etapa atual, contando de 1. É dele que cada etapa deriva o próprio estado.',
      table: { type: { summary: 'number' }, defaultValue: { summary: '1' } },
    },
    'aria-label': {
      control: 'text',
      description: 'Nome acessível do fluxo, na raiz. Sem ele o leitor de tela anuncia só uma lista.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '—' } },
    },
    labels: {
      control: 'object',
      description: 'Palavras de estado só para leitor de tela — completed e current. Moram na raiz porque o estado de cada etapa muda quando o fluxo avança.',
      table: { type: { summary: '{ completed?: string; current?: string }' }, defaultValue: { summary: '—' } },
    },
    onStepSelect: {
      control: false,
      description: 'Evento step-select, emitido com o número da etapa quando um gatilho disponível é acionado.',
      table: { type: { summary: '(step: number) => void' }, defaultValue: { summary: '—' } },
    },
    class: {
      control: false,
      description: 'Classes .nds-* adicionais na raiz.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '—' } },
    },
  },
  args: {
    'value': 2,
    'aria-label': FLOW_LABEL,
    'labels': STATE_LABELS,
    'onStepSelect': fn(),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => ({
    components: { Stepper, StepperItem, StepperTrigger, StepperIndicator, StepperTitle, StepperDescription, StepperSeparator },
    setup() {
      return { args, steps: FLOW_STEPS };
    },
    template: `
      <Stepper v-bind="args">
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
    covers: [
      'functional.item1',
      'accessibility.item1',
      'accessibility.item2',
      'accessibility.item3',
      'accessibility.item4',
      'accessibility.item6',
      'visual.item1',
    ],
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('A raiz é uma lista ordenada com um item por etapa', async () => {
      const root = canvasElement.querySelector('ol[data-slot="stepper"]');
      await expect(root).not.toBeNull();
      await expect(root).toHaveClass('nds-stepper');
      await expect(root).toHaveAttribute('aria-label', FLOW_LABEL);
      await expect(canvas.getAllByRole('listitem')).toHaveLength(FLOW_STEPS.length);
    });

    await step('Com o valor na segunda etapa, a anterior está concluída e as seguintes não alcançadas', async () => {
      const items = canvasElement.querySelectorAll('[data-slot="stepper-item"]');
      await expect(items[0]).toHaveAttribute('data-state', 'completed');
      await expect(items[1]).toHaveAttribute('data-state', 'active');
      await expect(items[2]).toHaveAttribute('data-state', 'inactive');
      await expect(items[3]).toHaveAttribute('data-state', 'inactive');
    });

    await step('Exatamente um controle carrega aria-current="step"', async () => {
      const marked = canvasElement.querySelectorAll('[aria-current]');
      await expect(marked).toHaveLength(1);
      await expect(marked[0]).toHaveAttribute('aria-current', 'step');
      await expect(marked[0]).toHaveAttribute('data-slot', 'stepper-trigger');
    });

    await step('O estado não depende só de cor: marca de verificação e palavra para leitor de tela', async () => {
      const items = canvasElement.querySelectorAll('[data-slot="stepper-item"]');
      const completed = items[0];
      const active = items[1];
      await expect(completed.querySelector('[data-slot="stepper-indicator"] svg')).not.toBeNull();
      await expect(completed.querySelector('[data-slot="stepper-state-label"]')).toHaveTextContent(STATE_LABELS.completed);
      await expect(active.querySelector('[data-slot="stepper-state-label"]')).toHaveTextContent(STATE_LABELS.current);
      await expect(active.querySelector('[data-slot="stepper-indicator"]')).toHaveTextContent('2');
    });

    await step('Indicador e traço ficam fora da árvore de acessibilidade', async () => {
      const decorations = canvasElement.querySelectorAll(
        '[data-slot="stepper-indicator"], [data-slot="stepper-separator"]',
      );
      await expect(decorations.length).toBe(FLOW_STEPS.length * 2 - 1);
      for (const decoration of decorations) {
        await expect(decoration).toHaveAttribute('aria-hidden', 'true');
      }
    });

    await step('Nenhuma região viva anuncia o avanço por cima da leitura da tela', async () => {
      await expect(
        canvasElement.querySelectorAll('[aria-live], [role="status"], [role="alert"], [role="log"]'),
      ).toHaveLength(0);
    });
  },
};
