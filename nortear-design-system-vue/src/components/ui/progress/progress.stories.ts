import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, waitFor, within } from 'storybook/test';
import { Progress } from './index';
import ProgressDocs from '@/components/docs/ProgressDocs.vue';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { percentualDesenhado } from '@shared/testing/progress-probe';
import { progressSource } from './progress.source';

const meta = {
  title: 'UI/Progress',
  component: Progress,
  tags: ['autodocs', 'feedback'],
  parameters: {
    layout: 'centered',
    docs: {
      page: withAutoDocsTab(ProgressDocs),
      source: { transform: progressSource },
      description: {
        component:
          'Progress é um indicador visual passivo para operações com duração mensurável. Aceita um valor de 0 a 100 ou nulo (indeterminate). role="progressbar" é aplicado pelo primitivo — o nome acessível é obrigatório e descreve a operação medida.',
      },
    },
  },
  argTypes: {
    modelValue: {
      control: { type: 'number', min: 0, max: 100, step: 1 },
      description: 'Valor atual de 0 a 100. Use null para modo indeterminate.',
      table: { type: { summary: 'number | null' }, defaultValue: { summary: '0' } },
    },
    max: {
      control: { type: 'number', min: 1 },
      description: 'Valor máximo da escala.',
      table: { type: { summary: 'number' }, defaultValue: { summary: '100' } },
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
  parameters: {
    covers: ['accessibility.item1', 'accessibility.item3', 'accessibility.item4'],
  },
  render: (args) => ({
    components: { Progress },
    setup() {
      return { args };
    },
    template: `
      <div class="nds-stack" data-spacing="xs" style="width: 360px">
        <div class="nds-cluster nds-text-body" data-align="center" data-justify="between">
          <span class="nds-text-foreground">Enviando arquivo</span>
          <span class="nds-text-muted-foreground nds-tabular-nums" aria-live="polite">{{ args.modelValue }}%</span>
        </div>
        <Progress v-bind="args" aria-label="Progresso do upload" />
      </div>
    `,
  }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);

    await step('A raiz é anunciada como barra de progresso, com nome próprio', async () => {
      const bar = canvas.getByRole('progressbar', { name: 'Progresso do upload' });
      await expect(bar).toHaveAttribute('data-slot', 'progress');
    });

    await step('A escala inteira chega ao leitor de tela', async () => {
      const bar = canvas.getByRole('progressbar');
      await expect(bar).toHaveAttribute('aria-valuenow', String(args.modelValue));
      await expect(bar).toHaveAttribute('aria-valuemin', '0');
      await expect(bar).toHaveAttribute('aria-valuemax', String(args.max));
    });

    await step('O indicador existe como parte própria', async () => {
      await expect(
        canvasElement.querySelector('[data-slot="progress-indicator"]'),
      ).not.toBeNull();
    });

    await step('A barra desenhada corresponde ao valor pedido', async () => {
      // Atributo certo com desenho errado já passou por aqui: medir é o único
      // jeito de saber que o valor virou pixel.
      const esperado = ((args.modelValue ?? 0) / (args.max ?? 100)) * 100;
      await waitFor(async () => {
        await expect(
          Math.abs(percentualDesenhado(canvasElement) - esperado),
        ).toBeLessThan(2);
      });
    });
  },
};
