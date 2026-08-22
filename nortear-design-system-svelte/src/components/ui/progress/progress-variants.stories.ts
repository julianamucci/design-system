import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { within, expect, waitFor } from 'storybook/test';
import ProgressStory from './ProgressStory.svelte';
import {
  barrasDeProgresso,
  contrastBarTrack,
  tokenColor,
  indicadorDoProgresso,
  accessibleName,
  percentualDesenhado,
} from '@shared/testing/progress-probe';
import { progressSource } from './progress.source';

const meta: Meta = {
  title: 'UI/Progress/Variants',
  component: ProgressStory,
  tags: ['feedback'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // Cascateia para todas as stories do arquivo: valor, rótulo e cor
      // semântica saem dos `args` de cada uma.
      source: { transform: progressSource },
      description: {
        component:
          'As formas de uso: valor conhecido, valor com rótulo e cor semântica. O indeterminate é estado, e mora na seção Estados.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Determinate: Story = {
  args: {
    value: 42,
    'aria-label': 'Progresso do upload',
  },
  parameters: {
    covers: ['accessibility.item2'],
    docs: {
      description: {
        story: 'Valor numérico 0–100. A barra é preenchida proporcionalmente.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O valor conhecido é anunciado e desenhado', async () => {
      await expect(canvas.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '42');
      await waitFor(async () => {
        await expect(Math.abs(percentualDesenhado(canvasElement) - 42)).toBeLessThan(2);
      });
    });

    await step('Indicador e trilha se distinguem com pelo menos 3:1', async () => {
      // WCAG 1.4.11: a barra só informa se for possível ver onde ela termina.
      await expect(contrastBarTrack(canvasElement)).toBeGreaterThanOrEqual(3);
    });
  },
};

export const Indeterminate: Story = {
  args: {
    value: null,
    'aria-label': 'Processando dados',
  },
  parameters: {
    docs: {
      description: {
        story:
          'value=null — sem estimativa. O primitivo marca data-indeterminate e o CSS compartilhado desenha o traço em ciclo a partir desse atributo.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Valor desconhecido não vira valor zero', async () => {
      const bar = canvas.getByRole('progressbar', { name: 'Processando dados' });
      await expect(bar).not.toHaveAttribute('aria-valuenow');
      await expect(bar).toHaveAttribute('data-indeterminate', '');
    });

    await step('Sem valor não há transform inline para posicionar a barra', async () => {
      const indicador = indicadorDoProgresso(canvasElement);
      await expect(indicador.getAttribute('style') ?? '').not.toContain('translateX');
    });
  },
};

export const WithLabel: Story = {
  args: {
    value: 42,
    'aria-label': 'Enviando arquivo',
    showLabel: true,
    label: 'Enviando arquivo',
    showValue: true,
  },
  parameters: {
    covers: ['accessibility.item5'],
    docs: {
      description: {
        story:
          'Rótulo descritivo + porcentagem (aria-live=polite) acima da trilha. Combinação recomendada para uploads e tarefas longas.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Label visível', async () => {
      await expect(canvas.getByText('Enviando arquivo')).toBeVisible();
    });

    await step('Valor 42% visível com aria-live polite', async () => {
      const valueEl = canvas.getByText('42%');
      await expect(valueEl).toBeVisible();
      await expect(valueEl).toHaveAttribute('aria-live', 'polite');
    });

    await step('Toda barra da tela tem nome acessível', async () => {
      for (const bar of barrasDeProgresso(canvasElement)) {
        await expect(accessibleName(bar)).not.toBe('');
      }
    });
  },
};

export const SemanticColor: Story = {
  args: {
    value: 100,
    variant: 'success',
    'aria-label': 'Sincronização concluída',
    showLabel: true,
    label: 'Sincronização',
    showValue: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'data-variant troca a cor da barra; a trilha continua neutra, para o contraste não depender da variante escolhida.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('A cor sai do atributo, não de uma classe morta', async () => {
      await expect(canvas.getByRole('progressbar')).toHaveAttribute('data-variant', 'success');
    });

    await step('A barra é pintada com o token de sucesso', async () => {
      // Sem esta comparação, um `data-variant` que o CSS ignorasse passaria: a
      // barra continuaria primária e o atributo estaria lá do mesmo jeito.
      const cor = getComputedStyle(indicadorDoProgresso(canvasElement)).backgroundColor;
      await expect(cor).toBe(tokenColor(canvasElement, '--success'));
      await expect(cor).not.toBe(tokenColor(canvasElement, '--primary'));
    });

    await step('A variante mantém 3:1 contra a trilha', async () => {
      await expect(contrastBarTrack(canvasElement)).toBeGreaterThanOrEqual(3);
    });
  },
};
