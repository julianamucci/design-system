import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { within, expect, waitFor } from 'storybook/test';
import ProgressStory from './ProgressStory.svelte';
import {
  indicadorAnimation,
  barrasDeProgresso,
  contrastBarTrack,
  tokenColor,
  indicadorDoProgresso,
  accessibleName,
  percentualDesenhado,
} from '@shared/testing/progress-probe';
import { progressSource } from './progress.source';

const meta: Meta = {
  title: 'Components/Feedback/Progress/Compositions',
  component: ProgressStory,
  tags: ['feedback'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // Cascateia para todas as stories do arquivo: rótulo, porcentagem e o
      // relógio do upload animado saem dos `args` de cada uma.
      source: { transform: progressSource },
      description: {
        component:
          'Composicoes comuns: upload animado com label/valor, loading simples, conclusão em cor de sucesso e processamento indeterminate.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const AnimatedUpload: Story = {
  args: {
    value: 0,
    'aria-label': 'Enviando arquivo',
    animated: true,
    intervalMs: 500,
    step: 5,
    showLabel: true,
    label: 'Enviando arquivo',
    showValue: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Upload com label "Enviando arquivo" + porcentagem viva (aria-live=polite). Valor incrementa 5% a cada 500ms.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Label e barra nomeada presentes', async () => {
      await expect(canvas.getByText('Enviando arquivo', { selector: 'span' })).toBeVisible();
      await expect(canvas.getByRole('progressbar', { name: 'Enviando arquivo' })).toBeInTheDocument();
    });

    await step('O valor anunciado fica dentro da escala em toda rodada', async () => {
      // O valor muda a cada 500ms; afirmar um número seria racy. O que vale em
      // qualquer instante é o intervalo.
      const agora = Number(canvas.getByRole('progressbar').getAttribute('aria-valuenow'));
      await expect(Number.isFinite(agora)).toBe(true);
      await expect(agora >= 0 && agora <= 100).toBe(true);
    });

    await step('O texto da porcentagem usa aria-live=polite', async () => {
      // `assertive` interromperia o leitor a cada 5% — é o par Do & Don't desta
      // página.
      const live = canvasElement.querySelector('[aria-live]');
      await expect(live).toHaveAttribute('aria-live', 'polite');
    });
  },
};

export const SimpleLoading: Story = {
  args: {
    value: 35,
    'aria-label': 'Carregando dados',
  },
  parameters: {
    docs: {
      description: {
        story: 'Progress sem label/valor — apenas indicação visual da operação em curso.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Barra nomeada pela operação, não pelo componente', async () => {
      const bar = canvas.getByRole('progressbar', { name: 'Carregando dados' });
      await expect(accessibleName(bar)).toBe('Carregando dados');
    });

    await step('Sem rótulo visível, o desenho ainda corresponde ao valor', async () => {
      await waitFor(async () => {
        await expect(Math.abs(percentualDesenhado(canvasElement) - 35)).toBeLessThan(2);
      });
    });
  },
};

export const SuccessCompletion: Story = {
  args: {
    value: 100,
    'aria-label': 'Operação concluída',
    variant: 'success',
    showLabel: true,
    label: 'Concluído',
    showValue: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'value=100 com a variante de sucesso. Combinação útil antes de remover o componente ou exibir mensagem final.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('aria-valuenow=100 e label "Concluído"', async () => {
      await expect(canvas.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
      await expect(canvas.getByText('Concluído')).toBeVisible();
    });

    await step('A barra é pintada com o token de sucesso', async () => {
      const cor = getComputedStyle(indicadorDoProgresso(canvasElement)).backgroundColor;
      await expect(cor).toBe(tokenColor(canvasElement, '--success'));
    });

    await step('A variante mantém 3:1 contra a trilha', async () => {
      await expect(contrastBarTrack(canvasElement)).toBeGreaterThanOrEqual(3);
    });
  },
};

export const ProcessingIndeterminate: Story = {
  args: {
    value: null,
    'aria-label': 'Processando…',
    showLabel: true,
    label: 'Processando…',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Processamento sem progresso mensurável. O rótulo descreve a operação enquanto não há porcentagem.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Sem aria-valuenow, com rótulo visível', async () => {
      const bar = canvas.getByRole('progressbar');
      await expect(bar).not.toHaveAttribute('aria-valuenow');
      await expect(canvas.getByText('Processando…', { selector: 'span' })).toBeVisible();
    });

    await step('Toda barra da tela tem nome acessível', async () => {
      for (const bar of barrasDeProgresso(canvasElement)) {
        await expect(accessibleName(bar)).not.toBe('');
      }
    });

    await step('O traço corre de verdade', async () => {
      await waitFor(async () => {
        await expect(indicadorAnimation(canvasElement)).toBe('nds-progress-indeterminate');
      });
    });
  },
};
