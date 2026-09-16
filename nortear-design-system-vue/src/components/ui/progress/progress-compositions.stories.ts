import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, waitFor, within } from 'storybook/test';
import { Progress } from './index';
import {
  barrasDeProgresso,
  contrastBarTrack,
  indicadorDoProgresso,
  accessibleName,
  percentualDesenhado,
} from '@shared/testing/progress-probe';
import {
  progressAriaBusyContainerSource,
  progressCustomColorSource,
  progressCustomValueTextSource,
  progressFileUploadSource,
  progressMultipleUploadsSource,
  progressWizardStepsSource,
} from './progress.source';

const meta = {
  title: 'Components/Feedback/Progress/Compositions',
  component: Progress,
  tags: ['feedback'],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: progressFileUploadSource },
      description: {
        component:
          'Composições do Progress em contextos reais de aplicação: upload num cartão, etapas de cadastro, vários uploads, cores semânticas, contêiner ocupado e texto anunciado próprio.',
      },
    },
  },
} satisfies Meta<typeof Progress>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Rótulo e valor acima da barra — o mesmo bloco em todas as composições.
 * Gera markup de template; o valor visível vive em região `polite`.
 */
function labeled(o: { value: number; label: string; ariaLabel: string; variant?: 'success' | 'destructive' }): string {
  const variant = o.variant ? ` data-variant="${o.variant}"` : '';
  return `
    <div class="nds-stack nds-w-full" data-spacing="xs">
      <div class="nds-cluster nds-text-body" data-justify="between">
        <span class="nds-text-foreground">${o.label}</span>
        <span class="nds-text-muted-foreground nds-tabular-nums" aria-live="polite">${o.value}%</span>
      </div>
      <Progress :model-value="${o.value}"${variant} aria-label="${o.ariaLabel}" />
    </div>`;
}

export const FileUpload: Story = {
  parameters: {
    // Declarada aqui, e não herdada do meta: o cartão do arquivo é o assunto
    // desta story, e o meta apontar para o mesmo construtor é coincidência.
    docs: { source: { transform: progressFileUploadSource } },
  },
  render: () => ({
    components: { Progress },
    template: `
      <div class="nds-stack nds-w-md nds-p-4 nds-rounded-lg nds-border-default nds-bg-card nds-text-card-foreground" data-spacing="sm">
        <div class="nds-text-body nds-font-medium">documento-final.pdf</div>
        <div class="nds-text-caption nds-text-muted-foreground">2.4 MB de 5.0 MB</div>
        ${labeled({ value: 48, label: 'Enviando arquivo', ariaLabel: 'Progresso do upload de documento-final.pdf' })}
      </div>
    `,
  }),
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
      // A trilha é semitransparente: sobre o cartão ela compõe outra cor.
      await expect(contrastBarTrack(canvasElement)).toBeGreaterThanOrEqual(3);
    });
  },
};

export const WizardSteps: Story = {
  parameters: {
    docs: { source: { transform: progressWizardStepsSource } },
  },
  render: () => ({
    components: { Progress },
    template: `
      <div class="nds-stack nds-w-md" data-spacing="sm">
        <div class="nds-cluster nds-text-body" data-justify="between">
          <span class="nds-text-foreground nds-font-medium">Etapa 3 de 5</span>
          <span class="nds-text-muted-foreground" aria-live="polite">Endereço</span>
        </div>
        <Progress :model-value="60" aria-label="Progresso do cadastro: etapa 3 de 5" />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O nome acessível conta a etapa, que o número sozinho não conta', async () => {
      await expect(accessibleName(canvas.getByRole('progressbar'))).toBe('Progresso do cadastro: etapa 3 de 5');
    });

    await step('Etapa 3 de 5 desenha 60% da trilha', async () => {
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
  parameters: {
    docs: { source: { transform: progressMultipleUploadsSource } },
  },
  render: () => ({
    components: { Progress },
    template: `
      <div class="nds-stack nds-w-md" data-spacing="md">
        ${labeled({ value: 100, label: 'foto-1.jpg', ariaLabel: 'Upload de foto-1.jpg concluído' })}
        ${labeled({ value: 74, label: 'foto-2.jpg', ariaLabel: 'Progresso do upload de foto-2.jpg' })}
        ${labeled({ value: 32, label: 'foto-3.jpg', ariaLabel: 'Progresso do upload de foto-3.jpg' })}
        ${labeled({ value: 0, label: 'foto-4.jpg', ariaLabel: 'Upload de foto-4.jpg aguardando' })}
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('4 progressbars, cada uma com o próprio valor', async () => {
      const values = canvas.getAllByRole('progressbar').map((b) => b.getAttribute('aria-valuenow'));
      await expect(values).toEqual(['100', '74', '32', '0']);
    });

    await step('Cada barra desenha o próprio valor', async () => {
      const barras = canvas.getAllByRole('progressbar');
      await waitFor(async () => {
        for (const [i, esperado] of [100, 74, 32, 0].entries()) {
          await expect(Math.abs(percentualDesenhado(barras[i]) - esperado)).toBeLessThan(2);
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
  parameters: {
    docs: { source: { transform: progressCustomColorSource } },
  },
  render: () => ({
    components: { Progress },
    template: `
      <div class="nds-stack nds-w-md" data-spacing="md">
        ${labeled({ value: 100, label: 'Sincronização', ariaLabel: 'Sincronização concluída', variant: 'success' })}
        ${labeled({ value: 72, label: 'Backup', ariaLabel: 'Progresso do backup' })}
        ${labeled({ value: 92, label: 'Espaço usado', ariaLabel: 'Espaço de armazenamento quase esgotado', variant: 'destructive' })}
      </div>
    `,
  }),
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
  parameters: {
    docs: { source: { transform: progressAriaBusyContainerSource } },
  },
  render: () => ({
    components: { Progress },
    template: `
      <div role="status" aria-busy="true" class="nds-stack nds-w-md nds-p-4 nds-rounded-lg nds-border-default nds-bg-card nds-text-card-foreground" data-spacing="sm">
        <div class="nds-text-body nds-font-medium">Processando relatório</div>
        <div class="nds-text-caption nds-text-muted-foreground">Isso pode levar alguns minutos.</div>
        ${labeled({ value: 35, label: 'Analisando dados', ariaLabel: 'Progresso da análise de dados' })}
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O contêiner declara que está ocupado', async () => {
      await expect(canvas.getByRole('status')).toHaveAttribute('aria-busy', 'true');
    });

    await step('aria-busy acompanha o estado real — a barra não terminou', async () => {
      const agora = Number(canvas.getByRole('progressbar').getAttribute('aria-valuenow'));
      await expect(agora).toBeLessThan(100);
    });

    await step('A barra vive dentro do contêiner ocupado', async () => {
      await expect(canvas.getByRole('status').contains(canvas.getByRole('progressbar'))).toBe(true);
    });
  },
};

export const CustomValueText: Story = {
  parameters: {
    covers: ['accessibility.item6'],
    docs: { source: { transform: progressCustomValueTextSource } },
  },
  render: () => ({
    components: { Progress },
    setup() {
      const filesText = (value: number | null | undefined, max: number) =>
        value == null ? 'Contando arquivos' : `${value} de ${max} arquivos`;
      return { filesText };
    },
    template: `
      <div class="nds-w-md">
        <Progress :model-value="42" aria-label="Processamento de arquivos" :get-value-text="filesText" />
      </div>
    `,
  }),
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

    await step('O nome continua sendo o aria-label, e não o texto do valor', async () => {
      // D9: o padrão da lib fabricava um nome a partir do valor.
      await expect(accessibleName(canvas.getByRole('progressbar'))).toBe('Processamento de arquivos');
    });
  },
};
