import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { within, expect, waitFor } from 'storybook/test';
import ProgressStory from './ProgressStory.svelte';
import {
  indicadorAnimation,
  indicadorDoProgresso,
  percentualDesenhado,
} from '@shared/testing/progress-probe';
import { progressSource } from './progress.source';

const meta: Meta = {
  title: 'Components/Feedback/Progress/States',
  component: ProgressStory,
  tags: ['feedback'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // Cascateia para todas as stories do arquivo: cada estado é um valor de
      // `args`, inclusive o `null` do indeterminado.
      source: { transform: progressSource },
      description: {
        component:
          'Estados derivados do valor: default (0), loading (parcial), complete (100) e indeterminate (sem valor, com o traço em ciclo).',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  args: {
    value: 0,
    'aria-label': 'Progresso',
  },
  parameters: {
    covers: ['functional.item1', 'visual.item1'],
    docs: {
      description: {
        story: 'value=0 — estado inicial, indicador em 0% (barra vazia).',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('value=0 anuncia zero e não desenha preenchimento', async () => {
      await expect(canvas.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
      await waitFor(async () => {
        await expect(percentualDesenhado(canvasElement)).toBeLessThan(1);
      });
    });

    await step('Zero não é o mesmo que indeterminate', async () => {
      // Sem esta linha, um bug que trocasse 0 por null passaria: as duas telas
      // são idênticas, mas só uma delas informa o progresso ao leitor.
      await expect(canvas.getByRole('progressbar')).not.toHaveAttribute('data-indeterminate');
    });
  },
};

export const Loading: Story = {
  args: {
    value: 50,
    'aria-label': 'Carregando dados',
  },
  parameters: {
    covers: ['functional.item2', 'visual.item2'],
    docs: {
      description: {
        story: 'value=50 — em progresso, indicador preenchido pela metade.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('value=50 preenche metade da trilha', async () => {
      await expect(canvas.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50');
      await waitFor(async () => {
        await expect(Math.abs(percentualDesenhado(canvasElement) - 50)).toBeLessThan(2);
      });
    });

    await step('O estado em progresso chega ao DOM', async () => {
      await expect(canvas.getByRole('progressbar')).toHaveAttribute('data-state', 'loading');
    });
  },
};

export const Complete: Story = {
  args: {
    value: 100,
    'aria-label': 'Concluído',
    variant: 'success',
  },
  parameters: {
    covers: ['functional.item3', 'visual.item3'],
    docs: {
      description: {
        story:
          'value=100 — finalizado, barra cheia. Considere remover ou trocar por mensagem de sucesso após conclusão.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('value=100 preenche a trilha inteira', async () => {
      await expect(canvas.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
      await waitFor(async () => {
        await expect(Math.abs(percentualDesenhado(canvasElement) - 100)).toBeLessThan(2);
      });
    });

    await step('A conclusão é um estado próprio no DOM', async () => {
      // Gancho de quem quer trocar cor ou remover a barra ao fim — sem ele, o
      // consumidor teria que comparar value com max.
      await expect(canvas.getByRole('progressbar')).toHaveAttribute('data-state', 'loaded');
    });
  },
};

export const Indeterminate: Story = {
  args: {
    value: null,
    'aria-label': 'Processando…',
  },
  parameters: {
    covers: ['functional.item4', 'visual.item4'],
    docs: {
      description: {
        story:
          'value=null — sem valor definido. O primitivo marca data-indeterminate e o CSS compartilhado anima o traço a partir desse atributo.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Sem valor, aria-valuenow some e o nome permanece', async () => {
      // Um `aria-valuenow` fixo em 0 mentiria: diria "zero por cento" quando a
      // verdade é "não sei quanto falta".
      const bar = canvas.getByRole('progressbar', { name: 'Processando…' });
      await expect(bar).not.toHaveAttribute('aria-valuenow');
      await expect(bar).toHaveAttribute('data-indeterminate', '');
    });

    await step('O traço corre de verdade', async () => {
      // Medir POSIÇÃO no meio de uma animação infinita é racy por construção —
      // o traço está sempre em outro lugar. Afirmar a existência da animação,
      // pelo nome do keyframes do design system, é o que dá para provar sem
      // sorte. Foi assim que se descobriu que não havia animação nenhuma.
      await waitFor(async () => {
        await expect(indicadorAnimation(canvasElement)).toBe('nds-progress-indeterminate');
      });
    });

    await step('O traço é o do design system, não o de um homônimo', async () => {
      // Discriminador do defeito que estava vivo: um segundo
      // `@keyframes nds-progress-indeterminate` morava em `utilities.css`, o
      // último import da folha, e vencia calado — mesmo NOME, outro conteúdo.
      // Afirmar o nome da animação não separa os dois; o efeito separa. O ciclo
      // do design system desloca `margin-inline-start` e deixa `transform` em
      // `none`; o homônimo animava `transform`, e aqui apareceria uma matriz.
      await expect(
        getComputedStyle(indicadorDoProgresso(canvasElement)).transform,
      ).toBe('none');
    });
  },
};
