import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect, waitFor, within } from 'storybook/test';
import { createProgress, type ProgressVariant } from './progress';
import {
  barrasDeProgresso,
  contrasteBarraTrilha,
  indicadorDoProgresso,
  nomeAcessivel,
  percentualDesenhado,
} from '@shared/testing/progress-probe';

const meta: Meta = {
  tags: ['feedback'],
  title: 'UI/Progress/Compositions',
  parameters: {
    actions: { disable: true },
    layout: 'padded',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Composicoes do Progress em contextos reais de aplicação. Como a factory desta stack ' +
          'não expõe ProgressLabel/ProgressValue/ProgressTrack, todos os exemplos compõem ' +
          'Label/Value via DOM nativo.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildBar(value: number, ariaLabel: string, variant?: ProgressVariant): HTMLElement {
  return createProgress({ value, variant, 'aria-label': ariaLabel });
}

function buildLabeled(opts: {
  value: number;
  label: string;
  ariaLabel: string;
  variant?: ProgressVariant;
}): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'nds-stack nds-w-full';
  wrap.dataset.spacing = 'xs';

  const row = document.createElement('div');
  row.className = 'nds-cluster nds-text-body';
  row.dataset.justify = 'between';

  const label = document.createElement('span');
  label.className = 'nds-text-foreground';
  label.textContent = opts.label;

  const value = document.createElement('span');
  value.className = 'nds-text-muted-foreground nds-tabular-nums';
  value.setAttribute('aria-live', 'polite');
  value.textContent = `${opts.value}%`;

  row.append(label, value);
  wrap.append(row, buildBar(opts.value, opts.ariaLabel, opts.variant));
  return wrap;
}

// ─── Upload de Arquivo ───────────────────────────────────────────────────────

export const FileUpload: Story = {
  render: () => {
    const card = document.createElement('div');
    card.className = 'nds-stack nds-w-full nds-max-w-md nds-p-4 nds-rounded-lg nds-border-default nds-bg-card nds-text-card-foreground';
    card.dataset.spacing = 'sm';

    const title = document.createElement('div');
    title.className = 'nds-text-body nds-font-medium';
    title.textContent = 'documento-final.pdf';

    const meta = document.createElement('div');
    meta.className = 'nds-text-caption nds-text-muted-foreground';
    meta.textContent = '2.4 MB de 5.0 MB';

    card.append(title, meta, buildLabeled({
      value: 48,
      label: 'Enviando arquivo',
      ariaLabel: 'Progresso do upload de documento-final.pdf',
    }));
    return card;
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
      await expect(contrasteBarraTrilha(canvasElement)).toBeGreaterThanOrEqual(3);
    });
  },
};

// ─── Multi-step Wizard ───────────────────────────────────────────────────────

export const WizardSteps: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.className = 'nds-stack nds-w-full nds-max-w-md';
    wrap.dataset.spacing = 'sm';

    const row = document.createElement('div');
    row.className = 'nds-cluster nds-text-body';
    row.dataset.justify = 'between';

    const label = document.createElement('span');
    label.className = 'nds-text-foreground nds-font-medium';
    label.textContent = 'Etapa 3 de 5';

    const value = document.createElement('span');
    value.className = 'nds-text-muted-foreground';
    value.setAttribute('aria-live', 'polite');
    value.textContent = 'Endereço';

    row.append(label, value);

    wrap.append(row, buildBar(60, 'Progresso do cadastro: etapa 3 de 5'));
    return wrap;
  },

  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O nome acessível conta a etapa, que o número sozinho não conta', async () => {
      const bar = canvas.getByRole('progressbar');
      await expect(nomeAcessivel(bar)).toBe('Progresso do cadastro: etapa 3 de 5');
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

// ─── Múltiplos Uploads ───────────────────────────────────────────────────────

export const MultipleUploads: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.className = 'nds-stack nds-w-full nds-max-w-md';
    wrap.dataset.spacing = 'md';

    wrap.append(
      buildLabeled({ value: 100, label: 'foto-1.jpg',     ariaLabel: 'Upload de foto-1.jpg concluído' }),
      buildLabeled({ value: 74,  label: 'foto-2.jpg',     ariaLabel: 'Progresso do upload de foto-2.jpg' }),
      buildLabeled({ value: 32,  label: 'foto-3.jpg',     ariaLabel: 'Progresso do upload de foto-3.jpg' }),
      buildLabeled({ value: 0,   label: 'foto-4.jpg',     ariaLabel: 'Upload de foto-4.jpg aguardando' }),
    );
    return wrap;
  },

  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('4 progressbars, cada uma com o próprio valor', async () => {
      const valores = canvas
        .getAllByRole('progressbar')
        .map((b) => b.getAttribute('aria-valuenow'));
      await expect(valores).toEqual(['100', '74', '32', '0']);
    });

    await step('Cada barra desenha o próprio valor', async () => {
      // Quatro barras com o mesmo desenho e atributos diferentes é o defeito
      // que a lista existe para pegar.
      const barras = canvas.getAllByRole('progressbar');
      await waitFor(async () => {
        for (const [i, esperado] of [100, 74, 32, 0].entries()) {
          await expect(Math.abs(percentualDesenhado(barras[i]) - esperado)).toBeLessThan(2);
        }
      });
    });

    await step('Nomes acessíveis distintos — a lista não confunde os arquivos', async () => {
      const nomes = barrasDeProgresso(canvasElement).map(nomeAcessivel);
      await expect(nomes.every((n) => n !== '')).toBe(true);
      await expect(new Set(nomes).size).toBe(4);
    });
  },
};

// ─── Cor Customizada ─────────────────────────────────────────────────────────

export const CustomColor: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.className = 'nds-stack nds-w-full nds-max-w-md';
    wrap.dataset.spacing = 'md';

    wrap.append(
      buildLabeled({
        value: 100,
        label: 'Sincronização',
        ariaLabel: 'Sincronização concluída',
        variant: 'success',
      }),
      buildLabeled({
        value: 72,
        label: 'Backup',
        ariaLabel: 'Progresso do backup',
      }),
      buildLabeled({
        value: 92,
        label: 'Espaço usado',
        ariaLabel: 'Espaço de armazenamento quase esgotado',
        variant: 'destructive',
      }),
    );
    return wrap;
  },

  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('3 progressbars, uma por cor', async () => {
      await expect(canvas.getAllByRole('progressbar')).toHaveLength(3);
    });

    await step('As três cores são realmente distintas', async () => {
      const cores = canvas
        .getAllByRole('progressbar')
        .map((raiz) => getComputedStyle(indicadorDoProgresso(raiz)).backgroundColor);
      await expect(new Set(cores).size).toBe(3);
    });

    await step('Nenhuma variante abre mão dos 3:1 contra a trilha', async () => {
      for (const raiz of canvas.getAllByRole('progressbar')) {
        await expect(contrasteBarraTrilha(raiz)).toBeGreaterThanOrEqual(3);
      }
    });

    await step('Toda barra da lista tem nome acessível', async () => {
      for (const bar of barrasDeProgresso(canvasElement)) {
        await expect(nomeAcessivel(bar)).not.toBe('');
      }
    });
  },
};

// ─── Container com aria-busy ─────────────────────────────────────────────────

export const AriaBusyContainer: Story = {
  render: () => {
    const status = document.createElement('div');
    status.setAttribute('role', 'status');
    status.setAttribute('aria-busy', 'true');
    status.className = 'nds-stack nds-w-full nds-max-w-md nds-p-4 nds-rounded-lg nds-border-default nds-bg-card nds-text-card-foreground';
    status.dataset.spacing = 'sm';

    const title = document.createElement('div');
    title.className = 'nds-text-body nds-font-medium';
    title.textContent = 'Processando relatório';

    const desc = document.createElement('div');
    desc.className = 'nds-text-caption nds-text-muted-foreground';
    desc.textContent = 'Isso pode levar alguns minutos.';

    status.append(title, desc, buildLabeled({
      value: 35,
      label: 'Analisando dados',
      ariaLabel: 'Progresso da análise de dados',
    }));
    return status;
  },

  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O contêiner declara que está ocupado', async () => {
      const status = canvas.getByRole('status');
      await expect(status).toHaveAttribute('aria-busy', 'true');
    });

    await step('aria-busy acompanha o estado real — a barra não terminou', async () => {
      // `aria-busy="true"` sobre uma barra em 100% seria contradição: o leitor
      // continuaria anunciando "ocupado" numa operação encerrada.
      const bar = canvas.getByRole('progressbar');
      const agora = Number(bar.getAttribute('aria-valuenow'));
      await expect(agora).toBeLessThan(100);
    });

    await step('A barra vive dentro do contêiner ocupado', async () => {
      const status = canvas.getByRole('status');
      await expect(status.contains(canvas.getByRole('progressbar'))).toBe(true);
    });
  },
};
