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
import { PROGRESS_INDETERMINATE_TEXT } from '@shared/primitives/progress-value';
import { progressSource } from './progress.source';

const meta: Meta = {
  title: 'Components/Feedback/Progress/Variants',
  component: ProgressStory,
  tags: ['feedback'],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // Cascateia para todas as stories do arquivo: valor, rótulo e cor
      // semântica saem dos `args` de cada uma.
      source: { transform: progressSource },
      description: {
        component:
          'As formas de uso: valor conhecido, sem valor, valor com rótulo e cor semântica.',
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
  // Sem `value` nas args, de propósito: OMITIR é a forma de pedir o modo
  // indeterminado, igual ao `<progress>` nativo. A lib daria zero.
  args: {
    'aria-label': 'Processando…',
  },
  parameters: {
    covers: ['functional.item6'],
    docs: {
      description: {
        story:
          'Valor omitido — sem estimativa. O primitivo marca data-indeterminate e o CSS compartilhado desenha o traço em ciclo a partir desse atributo.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Valor omitido não vira valor zero', async () => {
      const bar = canvas.getByRole('progressbar', { name: 'Processando…' });
      await expect(bar).not.toHaveAttribute('aria-valuenow');
      await expect(bar).toHaveAttribute('data-indeterminate', '');
    });

    await step('A faixa continua anunciada, e o texto diz que está em andamento', async () => {
      const bar = canvas.getByRole('progressbar');
      await expect(bar).toHaveAttribute('aria-valuemin', '0');
      await expect(bar).toHaveAttribute('aria-valuemax', '100');
      await expect(bar).toHaveAttribute('aria-valuetext', PROGRESS_INDETERMINATE_TEXT);
    });

    await step('Sem valor, --value não é escrita no indicador', async () => {
      // O desenho sai de `--value`, e uma custom property em 0 esconderia a
      // barra fora da vista — o estado indeterminado não teria o que animar.
      const indicador = indicadorDoProgresso(canvasElement);
      await expect(indicador.style.getPropertyValue('--value')).toBe('');
    });
  },
};

export const WithLabel: Story = {
  args: {
    value: 42,
    'aria-label': 'Enviando arquivo',
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

    await step('Label e valor visíveis acima da barra', async () => {
      await expect(canvas.getByText('Enviando arquivo')).toBeVisible();
      const valueEl = canvas.getByText('42%');
      await expect(valueEl).toBeVisible();
      await expect(valueEl).toHaveAttribute('aria-live', 'polite');
    });

    await step('O valor visível repete o valor anunciado', async () => {
      const bar = canvas.getByRole('progressbar');
      await expect(canvas.getByText('42%').textContent).toBe(`${bar.getAttribute('aria-valuenow')}%`);
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
    items: [
      { value: 100, variant: 'success', 'aria-label': 'Sincronização concluída' },
      { value: 92, variant: 'destructive', 'aria-label': 'Espaço de armazenamento quase esgotado' },
    ],
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

    await step('Duas barras, e a cor sai do atributo, não de uma classe morta', async () => {
      const [ok, critico] = canvas.getAllByRole('progressbar');
      await expect(canvas.getAllByRole('progressbar')).toHaveLength(2);
      await expect(ok).toHaveAttribute('data-variant', 'success');
      await expect(critico).toHaveAttribute('data-variant', 'destructive');
    });

    await step('Cada barra é pintada com o token da sua variante', async () => {
      // Sem esta comparação, um `data-variant` que o CSS ignorasse passaria: a
      // barra continuaria primária e o atributo estaria lá do mesmo jeito.
      const [ok, critico] = canvas.getAllByRole('progressbar');
      const colorOf = (root: HTMLElement) => getComputedStyle(indicadorDoProgresso(root)).backgroundColor;
      await expect(colorOf(ok)).toBe(tokenColor(ok, '--success'));
      await expect(colorOf(critico)).toBe(tokenColor(critico, '--destructive'));
      await expect(colorOf(ok)).not.toBe(colorOf(critico));
    });

    await step('As duas variantes mantêm 3:1 contra a trilha', async () => {
      // O contraste não pode depender de qual variante alguém escolheu.
      for (const root of canvas.getAllByRole('progressbar')) {
        await expect(contrastBarTrack(root)).toBeGreaterThanOrEqual(3);
      }
    });
  },
};
