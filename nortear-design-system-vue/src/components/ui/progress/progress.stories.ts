import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, waitFor, within } from 'storybook/test';
import { Progress } from './index';
import ProgressDocs from '@/components/docs/ProgressDocs.vue';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { accessibleName, percentualDesenhado } from '@shared/testing/progress-probe';
import {
  progressPercent,
  progressValueText,
  resolveProgressRange,
  resolveProgressValue,
} from '@shared/primitives/progress-value';
import { progressSource, type ProgressArgs } from './progress.source';

const meta = {
  title: 'Components/Feedback/Progress',
  component: Progress,
  tags: ['autodocs', 'feedback'],
  parameters: {
    layout: 'padded',
    docs: {
      page: withAutoDocsTab(ProgressDocs),
      source: { transform: progressSource },
      description: {
        component:
          'Progress é um indicador visual passivo para operações com duração mensurável. Sem valor, a barra é indeterminada. role="progressbar" é aplicado pelo primitivo — o nome acessível é obrigatório e descreve a operação medida.',
      },
    },
  },
  argTypes: {
    modelValue: {
      control: { type: 'number', step: 1 },
      description: 'Valor atual, limitado à faixa. Omitido ou null, a barra é indeterminada.',
      table: { type: { summary: 'number | null' }, defaultValue: { summary: 'null' } },
    },
    min: {
      control: { type: 'number' },
      description: 'Valor mínimo da escala.',
      table: { type: { summary: 'number' }, defaultValue: { summary: '0' } },
    },
    max: {
      control: { type: 'number' },
      description: 'Valor máximo da escala.',
      table: { type: { summary: 'number' }, defaultValue: { summary: '100' } },
    },
    variant: {
      control: { type: 'select' },
      options: ['', 'success', 'destructive'],
      description: 'Cor semântica da barra (atributo data-variant). Vazio, a barra usa o primário.',
      table: { type: { summary: "'success' | 'destructive'" }, defaultValue: { summary: '—' } },
    },
    ariaLabel: {
      control: 'text',
      description: 'Nome acessível da barra (atributo aria-label) — descreve a operação medida.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '—' } },
    },
  },
  args: {
    modelValue: 42,
    min: 0,
    max: 100,
    variant: '',
    ariaLabel: 'Progresso do upload',
  },
} satisfies Meta<ProgressArgs>;

export default meta;
type Story = StoryObj<ProgressArgs>;

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
      <div class="nds-w-md">
        <Progress
          :model-value="args.modelValue"
          :min="args.min"
          :max="args.max"
          :data-variant="args.variant || undefined"
          :aria-label="args.ariaLabel"
        />
      </div>
    `,
  }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const range = resolveProgressRange(args.min, args.max);
    const value = resolveProgressValue(args.modelValue, range);

    await step('A raiz é anunciada como barra de progresso, com nome próprio', async () => {
      const bar = canvas.getByRole('progressbar', { name: args.ariaLabel });
      await expect(bar).toHaveAttribute('data-slot', 'progress');
      await expect(accessibleName(bar)).toBe(args.ariaLabel);
    });

    await step('A faixa inteira e o valor limitado chegam ao leitor de tela', async () => {
      const bar = canvas.getByRole('progressbar');
      await expect(bar).toHaveAttribute('aria-valuemin', String(range.min));
      await expect(bar).toHaveAttribute('aria-valuemax', String(range.max));
      if (value === null) await expect(bar).not.toHaveAttribute('aria-valuenow');
      else await expect(bar).toHaveAttribute('aria-valuenow', String(value));
    });

    await step('O texto anunciado é o da regra compartilhada', async () => {
      await expect(canvas.getByRole('progressbar')).toHaveAttribute(
        'aria-valuetext',
        progressValueText(value, range),
      );
    });

    await step('A barra é passiva: não entra na ordem do Tab', async () => {
      await expect(canvas.getByRole('progressbar')).not.toHaveAttribute('tabindex');
    });

    await step('A barra desenhada corresponde ao percentual dentro da faixa', async () => {
      // Atributo certo com desenho errado já passou por aqui: medir é o único
      // jeito de saber que o valor virou pixel.
      const percent = progressPercent(value, range);
      if (percent === null) return;
      await waitFor(async () => {
        await expect(Math.abs(percentualDesenhado(canvasElement) - percent)).toBeLessThan(2);
      });
    });
  },
};
