import type { Meta, StoryObj } from '@storybook/html-vite';
import { within, expect, waitFor } from 'storybook/test';
import { createProgress } from './progress';
import { progressSource } from './progress.source';
import { createProgressDocs } from '@/components/docs/ProgressDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { percentualDesenhado } from '@shared/testing/progress-probe';
import {
  progressPercent,
  progressValueText,
  resolveProgressRange,
  resolveProgressValue,
} from '@shared/primitives/progress-value';

// ─── Meta ─────────────────────────────────────────────────────────────────────

type ProgressArgs = {
  value: number;
  min: number;
  max: number;
  variant: '' | 'success' | 'destructive';
  'aria-label': string;
};

const meta: Meta<ProgressArgs> = {
  title: 'Components/Feedback/Progress',
  tags: ['autodocs', 'feedback'],
  parameters: {
    layout: 'padded',
    docs: { page: withAutoDocsTab(createProgressDocs), source: { transform: progressSource } },
  },
  argTypes: {
    value: {
      control: { type: 'range', min: 0, max: 100, step: 1 },
      description: 'Valor atual, entre o mínimo e o máximo. Omitido ou `null`: indeterminado.',
      table: { type: { summary: 'number | null' }, defaultValue: { summary: '— (indeterminado)' } },
    },
    min: {
      control: { type: 'number' },
      description: 'Valor mínimo da escala.',
      table: { type: { summary: 'number' }, defaultValue: { summary: '0' } },
    },
    max: {
      control: { type: 'number', min: 1 },
      description: 'Valor máximo da escala.',
      table: { type: { summary: 'number' }, defaultValue: { summary: '100' } },
    },
    variant: {
      control: { type: 'select' },
      options: ['', 'success', 'destructive'],
      description: 'Cor semântica da barra. Vazio, a barra usa o primário.',
      table: { type: { summary: "'success' | 'destructive'" }, defaultValue: { summary: '—' } },
    },
    'aria-label': {
      control: 'text',
      description: 'Texto descrevendo o que está sendo medido. Obrigatório — opção `aria-label` da factory.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '—' } },
    },
  },
  args: {
    value: 42,
    min: 0,
    max: 100,
    variant: '',
    'aria-label': 'Progresso do upload',
  },
};

export default meta;
type Story = StoryObj<ProgressArgs>;

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  parameters: {
    covers: ['accessibility.item1', 'accessibility.item3', 'accessibility.item4'],
  },
  render: (args) => {
    const container = document.createElement('div');
    container.className = 'nds-w-md';
    const bar = createProgress({
      value: args.value,
      min: args.min,
      max: args.max,
      variant: args.variant || undefined,
      'aria-label': args['aria-label'],
    });
    container.appendChild(bar);
    return container;
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    // O esperado sai da MESMA regra que a fábrica lê: os controls deixam pedir
    // valor fora da faixa e máximo abaixo do mínimo, e a story tem de continuar
    // verdadeira nos dois.
    const range = resolveProgressRange(args.min, args.max);
    const value = resolveProgressValue(args.value, range);

    await step('A raiz é anunciada como barra de progresso, com nome próprio', async () => {
      // O nome vem da OPÇÃO `aria-label` da factory. A asserção já existia, mas
      // passava com a story escrevendo o atributo por fora depois de construir:
      // o buraco era da fábrica, e o teste não tinha como vê-lo.
      const bar = canvas.getByRole('progressbar', { name: args['aria-label'] });
      await expect(bar).toHaveAttribute('data-slot', 'progress');
      await expect(bar).toHaveAttribute('aria-label', args['aria-label']);
    });

    await step('A escala inteira chega ao leitor de tela', async () => {
      const bar = canvas.getByRole('progressbar');
      await expect(bar).toHaveAttribute('aria-valuemin', String(range.min));
      await expect(bar).toHaveAttribute('aria-valuemax', String(range.max));
      if (value === null) await expect(bar).not.toHaveAttribute('aria-valuenow');
      else await expect(bar).toHaveAttribute('aria-valuenow', String(value));
    });

    await step('O texto anunciado é o percentual da regra compartilhada', async () => {
      await expect(canvas.getByRole('progressbar')).toHaveAttribute(
        'aria-valuetext',
        progressValueText(value, range),
      );
    });

    await step('A barra é passiva: não entra na ordem de foco', async () => {
      await expect(canvas.getByRole('progressbar')).not.toHaveAttribute('tabindex');
    });

    await step('O indicador existe como parte própria', async () => {
      await expect(
        canvasElement.querySelector('[data-slot="progress-indicator"]'),
      ).not.toBeNull();
    });

    await step('A barra desenhada corresponde ao valor pedido', async () => {
      // Atributo certo com desenho errado já passou por aqui: medir é o único
      // jeito de saber que o valor virou pixel.
      const esperado = progressPercent(value, range);
      if (esperado === null) return;
      await waitFor(async () => {
        await expect(
          Math.abs(percentualDesenhado(canvasElement) - esperado),
        ).toBeLessThan(2);
      });
    });
  },
};
