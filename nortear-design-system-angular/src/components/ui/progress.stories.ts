import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, waitFor } from 'storybook/test';
import { NDS_PROGRESS } from './progress';
import { progressPlaygroundSource, type ProgressArgs } from './progress.source';
import { NdsProgressDocs } from '@/components/docs/ProgressDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { indicadorDoProgresso, percentualDesenhado } from '@shared/testing/progress-probe';
import {
  progressPercent,
  progressValueText,
  resolveProgressRange,
  resolveProgressValue,
} from '@shared/primitives/progress-value';

const meta: Meta<ProgressArgs> = {
  title: 'Components/Feedback/Progress',
  tags: ['autodocs', 'feedback'],
  decorators: [moduleMetadata({ imports: [...NDS_PROGRESS] })],
  parameters: {
    layout: 'padded',
    docs: { page: withAutoDocsTab(NdsProgressDocs) },
  },
  argTypes: {
    value: {
      control: { type: 'number', step: 1 },
      description: 'Valor atual da escala. Omitido (ou nulo) ativa o modo indeterminado; fora da faixa, é limitado.',
    },
    min: {
      control: { type: 'number', step: 1 },
      description: 'Valor mínimo da escala.',
    },
    max: {
      control: { type: 'number', step: 1 },
      description: 'Valor máximo da escala.',
    },
    variant: {
      control: { type: 'select' },
      options: ['', 'success', 'destructive'],
      description: 'Cor semântica da barra (`data-variant`). Vazio, a barra usa o primário.',
    },
    ariaLabel: {
      control: 'text',
      description: 'Nome acessível — descreve a operação medida, não o componente.',
    },
  },
  args: { value: 42, min: 0, max: 100, variant: '', ariaLabel: 'Progresso do upload' },
};

export default meta;
type Story = StoryObj<ProgressArgs>;

export const Playground: Story = {
  parameters: {
    docs: { source: { transform: progressPlaygroundSource } },
    // `accessibility.item5` mora no WithLabel: ele fala de nome acessível em
    // TODO exemplo, e o caminho difícil — nome vindo do rótulo, via
    // `aria-labelledby` — é o de lá.
    covers: ['accessibility.item1', 'accessibility.item3', 'accessibility.item4'],
  },
  render: (args) => ({
    props: { ...args },
    template: `
      <div class="nds-w-md">
        <div
          ndsProgress
          [value]="value"
          [min]="min"
          [max]="max"
          [attr.data-variant]="variant || null"
          [attr.aria-label]="ariaLabel"
        >
          <div ndsProgressTrack>
            <div ndsProgressIndicator></div>
          </div>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    // O esperado sai da regra compartilhada, e não de uma conta refeita aqui:
    // é ela que as cinco stacks prometem seguir.
    const range = resolveProgressRange(args.min, args.max);
    const value = resolveProgressValue(args.value, range);
    const percent = progressPercent(value, range);

    await step('A raiz é anunciada como barra de progresso, com nome próprio', async () => {
      const bar = canvas.getByRole('progressbar', { name: args.ariaLabel });
      await expect(bar.getAttribute('data-slot')).toBe('progress');
    });

    await step('A escala inteira chega ao leitor de tela', async () => {
      const bar = canvas.getByRole('progressbar');
      await expect(bar).toHaveAttribute('aria-valuemin', String(range.min));
      await expect(bar).toHaveAttribute('aria-valuemax', String(range.max));
      if (value === null) {
        await expect(bar).not.toHaveAttribute('aria-valuenow');
      } else {
        await expect(bar).toHaveAttribute('aria-valuenow', String(value));
      }
    });

    await step('O texto anunciado é o da regra compartilhada', async () => {
      // A lib escreve o próprio texto — em inglês no indeterminado. O que vale
      // é o do componente, que escreve depois dela.
      const bar = canvas.getByRole('progressbar');
      await waitFor(() =>
        expect(bar.getAttribute('aria-valuetext')).toBe(progressValueText(value, range)),
      );
    });

    await step('A barra é passiva: não entra na ordem do Tab', async () => {
      await expect(canvas.getByRole('progressbar')).not.toHaveAttribute('tabindex');
    });

    await step('O percentual vira a custom property que o CSS lê', async () => {
      // O primitivo não escreve largura nem transform: o CSS lê `--value`, que
      // é PERCENTUAL, e não o número cru — com mínimo diferente de zero, os
      // dois divergem.
      const indicador = indicadorDoProgresso(canvasElement);
      const written = indicador.style.getPropertyValue('--value');
      if (percent === null) {
        await expect(written).toBe('');
      } else {
        await expect(Number(written)).toBeCloseTo(percent, 3);
      }
    });

    if (percent !== null) {
      await step('A barra desenhada corresponde ao percentual', async () => {
        // Medir é o único jeito de saber que a custom property foi CONSUMIDA.
        await waitFor(async () => {
          await expect(Math.abs(percentualDesenhado(canvasElement) - percent)).toBeLessThan(2);
        });
      });
    }
  },
};
