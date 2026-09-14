import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { within, expect, waitFor } from 'storybook/test';
import ProgressStory from './ProgressStory.svelte';
import {
  barrasDeProgresso,
  contrastBarTrack,
  indicadorDoProgresso,
  accessibleName,
  percentualDesenhado,
} from '@shared/testing/progress-probe';
import { progressSource, progressValueTextSource } from './progress.source';

const meta: Meta = {
  title: 'Components/Feedback/Progress/Compositions',
  component: ProgressStory,
  tags: ['feedback'],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // Cascateia para todas as stories do arquivo: cartão, rótulos e listas
      // saem dos `args` de cada uma. Só o texto anunciado pede transform
      // própria, porque uma função não se imprime a partir de `args`.
      source: { transform: progressSource },
      description: {
        component:
          'Composições do Progress em contextos reais de aplicação: upload num cartão, etapas de cadastro, lista de uploads, cores por situação, contêiner ocupado e texto anunciado próprio.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const FileUpload: Story = {
  args: {
    card: { title: 'documento-final.pdf', meta: '2.4 MB de 5.0 MB' },
    value: 48,
    label: 'Enviando arquivo',
    showValue: true,
    'aria-label': 'Progresso do upload de documento-final.pdf',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('A barra nomeia o arquivo, não o componente', async () => {
      const bar = await canvas.findByRole('progressbar');
      await expect(bar).toHaveAttribute('aria-label', 'Progresso do upload de documento-final.pdf');
      await expect(bar).toHaveAttribute('aria-valuenow', '48');
    });

    await step('O desenho corresponde ao valor anunciado', async () => {
      await waitFor(async () => {
        await expect(Math.abs(percentualDesenhado(canvasElement) - 48)).toBeLessThan(2);
      });
    });

    await step('A barra herda a cor do cartão sem perder contraste', async () => {
      // A trilha é semitransparente: sobre o fundo do cartão ela compõe uma cor
      // diferente da que compõe sobre a página. O limite de 3:1 vale nos dois.
      await expect(contrastBarTrack(canvasElement)).toBeGreaterThanOrEqual(3);
    });
  },
};

export const WizardSteps: Story = {
  args: {
    value: 60,
    label: 'Etapa 3 de 5',
    strongLabel: true,
    valueText: 'Endereço',
    'aria-label': 'Progresso do cadastro: etapa 3 de 5',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O nome acessível conta a etapa, que o número sozinho não conta', async () => {
      await expect(accessibleName(canvas.getByRole('progressbar'))).toBe('Progresso do cadastro: etapa 3 de 5');
    });

    await step('Etapa 3 de 5 desenha 60% da trilha', async () => {
      // O valor tem que casar com o texto: uma barra em 50% ao lado de "etapa 3
      // de 5" seria a informação certa com o desenho errado.
      await expect(canvas.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '60');
      await waitFor(async () => {
        await expect(Math.abs(percentualDesenhado(canvasElement) - 60)).toBeLessThan(2);
      });
    });

    await step('O nome da etapa é anunciado em região polite', async () => {
      const live = canvasElement.querySelector('[aria-live]');
      await expect(live).toHaveAttribute('aria-live', 'polite');
      await expect(live?.textContent).toBe('Endereço');
    });
  },
};

export const MultipleUploads: Story = {
  args: {
    spacing: 'md',
    items: [
      { value: 100, label: 'foto-1.jpg', showValue: true, 'aria-label': 'Upload de foto-1.jpg concluído' },
      { value: 74, label: 'foto-2.jpg', showValue: true, 'aria-label': 'Progresso do upload de foto-2.jpg' },
      { value: 32, label: 'foto-3.jpg', showValue: true, 'aria-label': 'Progresso do upload de foto-3.jpg' },
      { value: 0, label: 'foto-4.jpg', showValue: true, 'aria-label': 'Upload de foto-4.jpg aguardando' },
    ],
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('4 progressbars, cada uma com o próprio valor', async () => {
      const values = canvas.getAllByRole('progressbar').map((b) => b.getAttribute('aria-valuenow'));
      await expect(values).toEqual(['100', '74', '32', '0']);
    });

    await step('Cada barra desenha o próprio valor', async () => {
      // Quatro barras com o mesmo desenho e atributos diferentes é o defeito
      // que a lista existe para pegar.
      const barras = canvas.getAllByRole('progressbar');
      await waitFor(async () => {
        for (const [i, esperado] of [100, 74, 32, 0].entries()) {
          await expect(Math.abs(percentualDesenhado(barras[i]!) - esperado)).toBeLessThan(2);
        }
      });
    });

    await step('Nomes acessíveis distintos — a lista não confunde os arquivos', async () => {
      const names = barrasDeProgresso(canvasElement).map(accessibleName);
      await expect(names.every((n) => n !== '')).toBe(true);
      await expect(new Set(names).size).toBe(4);
    });
  },
};

export const CustomColor: Story = {
  args: {
    spacing: 'md',
    items: [
      {
        value: 100,
        variant: 'success',
        label: 'Sincronização',
        showValue: true,
        'aria-label': 'Sincronização concluída',
      },
      { value: 72, label: 'Backup', showValue: true, 'aria-label': 'Progresso do backup' },
      {
        value: 92,
        variant: 'destructive',
        label: 'Espaço usado',
        showValue: true,
        'aria-label': 'Espaço de armazenamento quase esgotado',
      },
    ],
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('3 progressbars, uma por cor', async () => {
      await expect(canvas.getAllByRole('progressbar')).toHaveLength(3);
    });

    await step('As três cores são realmente distintas', async () => {
      const colors = canvas
        .getAllByRole('progressbar')
        .map((root) => getComputedStyle(indicadorDoProgresso(root)).backgroundColor);
      await expect(new Set(colors).size).toBe(3);
    });

    await step('Nenhuma variante abre mão dos 3:1 contra a trilha', async () => {
      for (const root of canvas.getAllByRole('progressbar')) {
        await expect(contrastBarTrack(root)).toBeGreaterThanOrEqual(3);
      }
    });

    await step('Toda barra da lista tem nome acessível', async () => {
      for (const bar of barrasDeProgresso(canvasElement)) {
        await expect(accessibleName(bar)).not.toBe('');
      }
    });
  },
};

export const AriaBusyContainer: Story = {
  args: {
    card: { title: 'Processando relatório', meta: 'Isso pode levar alguns minutos.', busy: true },
    value: 35,
    label: 'Analisando dados',
    showValue: true,
    'aria-label': 'Progresso da análise de dados',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O contêiner declara que está ocupado', async () => {
      await expect(canvas.getByRole('status')).toHaveAttribute('aria-busy', 'true');
    });

    await step('aria-busy acompanha o estado real — a barra não terminou', async () => {
      // `aria-busy="true"` sobre uma barra em 100% seria contradição: o leitor
      // continuaria anunciando "ocupado" numa operação encerrada.
      const now = Number(canvas.getByRole('progressbar').getAttribute('aria-valuenow'));
      await expect(now).toBeLessThan(100);
    });

    await step('A barra vive dentro do contêiner ocupado', async () => {
      await expect(canvas.getByRole('status').contains(canvas.getByRole('progressbar'))).toBe(true);
    });
  },
};

/** O texto anunciado da story — o mesmo que o snippet do painel ensina. */
function filesText(value: number | null, min: number, max: number): string {
  return value === null ? 'Contando arquivos' : `${value} de ${max} arquivos`;
}

export const CustomValueText: Story = {
  args: {
    value: 42,
    'aria-label': 'Processamento de arquivos',
    getAriaValueText: filesText,
  },
  parameters: {
    covers: ['accessibility.item6'],
    // Override de story: a função não se imprime a partir de `args`.
    docs: { source: { transform: progressValueTextSource } },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('A função de quem compõe vence o percentual padrão', async () => {
      const bar = canvas.getByRole('progressbar', { name: 'Processamento de arquivos' });
      await expect(bar).toHaveAttribute('aria-valuetext', '42 de 100 arquivos');
    });

    await step('O número continua anunciado e desenhado', async () => {
      // Trocar o texto não pode custar o valor: `aria-valuenow` e o desenho
      // seguem a escala.
      await expect(canvas.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '42');
      await waitFor(async () => {
        await expect(Math.abs(percentualDesenhado(canvasElement) - 42)).toBeLessThan(2);
      });
    });
  },
};
