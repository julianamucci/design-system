import type { Meta, StoryObj } from '@storybook/vue3';
import { expect } from 'storybook/test';
import { Progress } from './index';
import ProgressDocs from '@/components/docs/ProgressDocs.vue';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const meta = {
  title: 'UI/Progress',
  component: Progress,
  tags: ['autodocs', 'feedback'],
  parameters: {
    layout: 'centered',
    docs: {
      page: withAutoDocsTab(ProgressDocs),
      description: {
        component:
          'Progress é um indicador visual passivo para operações com duração mensurável. Aceita modelValue de 0 a 100 ou null (indeterminate). role="progressbar" é aplicado automaticamente pelo reka-ui — aria-label é obrigatório para descrever a operação medida.',
      },
    },
  },
  argTypes: {
    modelValue: {
      control: { type: 'number', min: 0, max: 100, step: 1 },
      description: 'Valor atual de 0 a 100. Use null para modo indeterminate.',
    },
    max: {
      control: { type: 'number', min: 1 },
      description: 'Valor máximo da escala.',
    },
  },
  args: {
    modelValue: 42,
    max: 100,
  },
} satisfies Meta<typeof Progress>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => ({
    components: { Progress },
    setup() {
      return { args };
    },
    template: `
      <div class="w-[360px] space-y-1.5">
        <div class="flex items-center justify-between text-sm">
          <span class="text-foreground">Enviando arquivo</span>
          <span class="text-muted-foreground tabular-nums" aria-live="polite">{{ args.modelValue }}%</span>
        </div>
        <Progress v-bind="args" aria-label="Progresso do upload" />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('Progress com data-slot=progress está presente', async () => {
      const progress = canvasElement.querySelector('[data-slot="progress"]');
      await expect(progress).toBeInTheDocument();
    });

    await step('role="progressbar" aplicado pelo reka-ui', async () => {
      const progress = canvasElement.querySelector('[data-slot="progress"]');
      await expect(progress).toHaveAttribute('role', 'progressbar');
    });

    await step('aria-label obrigatório presente', async () => {
      const progress = canvasElement.querySelector('[data-slot="progress"]');
      await expect(progress).toHaveAttribute('aria-label', 'Progresso do upload');
    });

    await step('aria-valuenow espelha modelValue', async () => {
      const progress = canvasElement.querySelector('[data-slot="progress"]');
      await expect(progress).toHaveAttribute('aria-valuenow', '42');
    });

    await step('Indicator com data-slot=progress-indicator presente', async () => {
      const indicator = canvasElement.querySelector('[data-slot="progress-indicator"]');
      await expect(indicator).toBeInTheDocument();
    });
  },
};
