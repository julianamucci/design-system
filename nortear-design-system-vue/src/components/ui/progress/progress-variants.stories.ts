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
  progressWithLabelSource,
  progressColorSemanticaSource,
  progressDeterminadoSource,
  progressIndeterminadoSource,
} from './progress.source';

const meta = {
  title: 'Components/Feedback/Progress/Variants',
  component: Progress,
  tags: ['feedback'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: progressDeterminadoSource },
      description: {
        component:
          'As formas de uso: valor conhecido, valor com rótulo e cor semântica. O indeterminate é estado, e mora na seção Estados.',
      },
    },
  },
} satisfies Meta<typeof Progress>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Determinate: Story = {
  parameters: { covers: ['accessibility.item2'] },
  render: () => ({
    components: { Progress },
    template: `
      <div style="width: 360px">
        <Progress :model-value="42" aria-label="Progresso do upload" />
      </div>
    `,
  }),
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
  parameters: {
    docs: {
      // `null` não é um número menor: é a AUSÊNCIA de valor, e com ela some o
      // `aria-valuenow` que a do meta publica.
      source: { transform: progressIndeterminadoSource },
    },
  },
  render: () => ({
    components: { Progress },
    template: `
      <div style="width: 360px">
        <Progress :model-value="null" aria-label="Processando dados" />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Valor desconhecido não vira valor zero', async () => {
      const bar = canvas.getByRole('progressbar', { name: 'Processando dados' });
      await expect(bar).not.toHaveAttribute('aria-valuenow');
      await expect(bar).toHaveAttribute('data-indeterminate', '');
    });

    await step('Sem valor não há transform inline para posicionar a barra', async () => {
      // O desenho passa a ser da animação, não de uma posição calculada.
      const indicador = indicadorDoProgresso(canvasElement);
      await expect(indicador.getAttribute('style') ?? '').not.toContain('translateX');
    });
  },
};

export const WithLabel: Story = {
  parameters: {
    covers: ['accessibility.item5'],
    docs: {
      // A barra ganha rótulo e porcentagem em volta: a composição de texto é o
      // assunto, e a do meta não tem texto nenhum.
      source: { transform: progressWithLabelSource },
    },
  },
  render: () => ({
    components: { Progress },
    template: `
      <div class="nds-stack" data-spacing="xs" style="width: 360px">
        <div class="nds-cluster nds-text-body" data-align="center" data-justify="between">
          <span class="nds-text-foreground">Enviando arquivo</span>
          <span class="nds-text-muted-foreground nds-tabular-nums" aria-live="polite">42%</span>
        </div>
        <Progress :model-value="42" aria-label="Enviando arquivo" />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Rótulo textual visível acima da trilha', async () => {
      await expect(canvas.getByText('Enviando arquivo')).toBeVisible();
    });

    await step('Valor 42% com aria-live polite', async () => {
      const value = canvasElement.querySelector('[aria-live="polite"]');
      await expect(value).toBeInTheDocument();
      await expect(value?.textContent).toBe('42%');
    });

    await step('Toda barra da tela tem nome acessível', async () => {
      for (const bar of barrasDeProgresso(canvasElement)) {
        await expect(accessibleName(bar)).not.toBe('');
      }
    });
  },
};

export const SemanticColor: Story = {
  parameters: {
    docs: {
      // Duas barras lado a lado: a variante só se lê CONTRA outra, e o atributo
      // `data-variant` não aparece na do meta.
      source: { transform: progressColorSemanticaSource },
    },
  },
  render: () => ({
    components: { Progress },
    template: `
      <div class="nds-stack" data-spacing="sm" style="width: 360px">
        <Progress :model-value="100" data-variant="success" aria-label="Sincronização concluída" />
        <Progress :model-value="92" data-variant="destructive" aria-label="Espaço de armazenamento quase esgotado" />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Cada variante pinta a barra de uma cor diferente', async () => {
      const [ok, critico] = canvas.getAllByRole('progressbar');
      const colorOf = (root: HTMLElement) =>
        getComputedStyle(indicadorDoProgresso(root)).backgroundColor;
      await expect(colorOf(ok)).not.toBe(colorOf(critico));
    });

    await step('As duas variantes mantêm 3:1 contra a trilha', async () => {
      // O contraste não pode depender de qual variante alguém escolheu — é o
      // motivo de a trilha continuar neutra em vez de acompanhar a cor.
      for (const root of canvas.getAllByRole('progressbar')) {
        await expect(contrastBarTrack(root)).toBeGreaterThanOrEqual(3);
      }
    });

    await step('A cor sai do atributo, não de uma classe morta', async () => {
      const [ok] = canvas.getAllByRole('progressbar');
      await expect(ok).toHaveAttribute('data-variant', 'success');
    });
  },
};
