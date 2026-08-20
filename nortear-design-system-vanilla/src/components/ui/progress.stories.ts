import type { Meta, StoryObj } from '@storybook/html-vite';
import { within, expect, waitFor } from 'storybook/test';
import { createProgress } from './progress';
import { progressSource } from './progress.source';
import { createProgressDocs } from '@/components/docs/ProgressDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { percentualDesenhado } from '@shared/testing/progress-probe';

// ─── Meta ─────────────────────────────────────────────────────────────────────

type ProgressArgs = {
  value: number;
  max: number;
  variant: '' | 'success' | 'destructive';
  'aria-label': string;
};

const meta: Meta<ProgressArgs> = {
  title: 'UI/Progress',
  tags: ['autodocs', 'feedback'],
  parameters: {
    layout: 'padded',
    docs: { page: withAutoDocsTab(createProgressDocs), source: { transform: progressSource } },
  },
  argTypes: {
    value: {
      control: { type: 'range', min: 0, max: 100, step: 1 },
      description: 'Valor atual (0–max).',
      table: { type: { summary: 'number | null' }, defaultValue: { summary: '0' } },
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
    container.className = 'nds-w-full nds-max-w-md';
    const bar = createProgress({
      value: args.value,
      max: args.max,
      variant: args.variant || undefined,
      'aria-label': args['aria-label'],
    });
    container.appendChild(bar);
    return container;
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);

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
      await expect(bar).toHaveAttribute('aria-valuenow', String(args.value));
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
      const esperado = (args.value / args.max) * 100;
      await waitFor(async () => {
        await expect(
          Math.abs(percentualDesenhado(canvasElement) - esperado),
        ).toBeLessThan(2);
      });
    });
  },
};
