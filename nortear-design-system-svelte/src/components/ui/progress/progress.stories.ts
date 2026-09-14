import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { within, expect, waitFor } from 'storybook/test';
import { Progress } from './index';
import ProgressStory from './ProgressStory.svelte';
import ProgressDocs from '@/components/docs/ProgressDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { accessibleName, percentualDesenhado } from '@shared/testing/progress-probe';
import {
  progressPercent,
  progressValueText,
  resolveProgressRange,
  resolveProgressValue,
} from '@shared/primitives/progress-value';
import { progressSource, type ProgressArgs } from './progress.source';

const meta: Meta = {
  title: 'Components/Feedback/Progress',
  component: Progress,
  tags: ['autodocs', 'feedback'],
  parameters: {
    layout: 'padded',
    docs: {
      page: withAutoDocsTab(ProgressDocs),
      // Cascateia para todas as stories do arquivo, e monta o exemplo a partir
      // dos `args` de cada uma.
      source: { transform: progressSource },
      description: {
        component:
          'Indicador visual de progresso de operações com duração mensurável. Valor omitido ou null ativa o modo indeterminado.',
      },
    },
  },
  argTypes: {
    value: {
      control: { type: 'number', step: 1 },
      description: 'Valor atual, limitado ao mínimo e ao máximo. Omitido ou null ativa o modo indeterminado.',
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
      description: 'Cor semântica da barra, escrita em data-variant. Ausente, a barra usa o primário.',
      table: { type: { summary: "'success' | 'destructive'" }, defaultValue: { summary: '—' } },
    },
    'aria-label': {
      control: { type: 'text' },
      description: 'Nome acessível — descreve a operação medida.',
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
type Story = StoryObj;

export const Playground: Story = {
  parameters: {
    covers: ['accessibility.item1', 'accessibility.item3', 'accessibility.item4'],
  },
  // A opção vazia do control é `''`, como nas outras stacks: vira "sem variante"
  // antes de chegar ao wrapper, para não escrever `data-variant=""` na barra.
  render: (args) => ({ Component: ProgressStory, props: { ...args, variant: args.variant || undefined } }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const a = args as Partial<ProgressArgs>;
    // O esperado sai da MESMA regra que o wrapper usa: mexer num control e
    // afirmar um número escrito à mão aqui seria testar a story, não a barra.
    const range = resolveProgressRange(a.min, a.max);
    const value = resolveProgressValue(a.value, range);

    await step('A raiz é anunciada como barra de progresso, com nome próprio', async () => {
      const bar = canvas.getByRole('progressbar');
      await expect(bar).toHaveAttribute('data-slot', 'progress');
      await expect(accessibleName(bar)).toBe(a['aria-label']);
    });

    await step('A faixa inteira chega ao leitor de tela', async () => {
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

    await step('A barra desenhada corresponde ao valor pedido', async () => {
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
