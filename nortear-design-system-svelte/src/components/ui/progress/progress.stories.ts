import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { within, expect, waitFor } from 'storybook/test';
import { Progress } from './index';
import ProgressStory from './ProgressStory.svelte';
import ProgressDocs from '@/components/docs/ProgressDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { percentualDesenhado } from '@shared/testing/progress-probe';
import { progressSource } from './progress.source';

const meta: Meta = {
  title: 'UI/Progress',
  component: Progress,
  tags: ['autodocs', 'feedback'],
  parameters: {
    layout: 'centered',
    docs: {
      page: withAutoDocsTab(ProgressDocs),
      // Cascateia para todas as stories do arquivo, e monta o exemplo a partir
      // dos `args` de cada uma.
      source: { transform: progressSource },
      description: {
        component:
          'Indicador visual de progresso de operações com duração mensurável. Suporta modo determinate (value 0–100) e indeterminate (value=null).',
      },
    },
  },
  argTypes: {
    value: {
      control: { type: 'number', min: 0, max: 100, step: 1 },
      description: 'Valor atual de 0 a 100. null ativa modo indeterminate.',
      table: { type: { summary: 'number | null' }, defaultValue: { summary: '0' } },
    },
    max: {
      control: { type: 'number' },
      description: 'Valor máximo da escala.',
      table: { type: { summary: 'number' }, defaultValue: { summary: '100' } },
    },
    variant: {
      control: { type: 'select' },
      options: [undefined, 'success', 'destructive'],
      description: 'Cor semântica da barra. Ausente, a barra usa o primário.',
      table: { type: { summary: "'success' | 'destructive'" }, defaultValue: { summary: '—' } },
    },
    class: {
      control: { type: 'text' },
      description:
        'Classes utilitárias .nds-* adicionais. A cor da barra não se troca por classe — use variant.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '—' } },
    },
  },
  args: {
    value: 42,
    max: 100,
    variant: undefined,
    class: '',
  },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  parameters: {
    covers: ['accessibility.item1', 'accessibility.item3', 'accessibility.item4'],
  },
  render: (args) => ({
    Component: ProgressStory,
    props: {
      value: args.value,
      max: args.max,
      variant: args.variant,
      class: args.class,
      'aria-label': 'Progresso do upload',
    },
  }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);

    await step('A raiz é anunciada como barra de progresso, com nome próprio', async () => {
      const bar = canvas.getByRole('progressbar', { name: 'Progresso do upload' });
      await expect(bar).toHaveAttribute('data-slot', 'progress');
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
      const esperado = ((args.value ?? 0) / (args.max ?? 100)) * 100;
      await waitFor(async () => {
        await expect(
          Math.abs(percentualDesenhado(canvasElement) - esperado),
        ).toBeLessThan(2);
      });
    });
  },
};
