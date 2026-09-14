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
import { PROGRESS_INDETERMINATE_TEXT } from '@shared/primitives/progress-value';
import {
  progressBarSnippet,
  progressSemanticColorSource,
  progressWithLabelSource,
} from './progress.source';

const meta = {
  title: 'Components/Feedback/Progress/Variants',
  component: Progress,
  tags: ['feedback'],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: () => progressBarSnippet({ value: 42, label: 'Progresso do upload' }) },
      description: {
        component:
          'As formas de uso: valor conhecido, sem valor, valor com rótulo e cor semântica. Não há peça de rótulo nesta stack: rótulo e valor são texto acima da barra, e o nome vai em aria-label.',
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
      <div class="nds-w-md">
        <Progress :model-value="42" aria-label="Progresso do upload" />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O valor conhecido é anunciado e desenhado', async () => {
      const bar = canvas.getByRole('progressbar', { name: 'Progresso do upload' });
      await expect(bar).toHaveAttribute('aria-valuenow', '42');
      await expect(bar).toHaveAttribute('aria-valuetext', '42%');
      await waitFor(async () => {
        await expect(Math.abs(percentualDesenhado(canvasElement) - 42)).toBeLessThan(2);
      });
    });

    await step('O desenho sai de --value, e não de transform inline', async () => {
      // Estilo inline vence qualquer especificidade: escrever `transform` aqui
      // sobrescreveria a regra da folha compartilhada em vez de alimentá-la.
      const indicador = indicadorDoProgresso(canvasElement);
      await expect(indicador.style.getPropertyValue('--value')).toBe('42');
      await expect(indicador.style.transform).toBe('');
    });

    await step('Indicador e trilha se distinguem com pelo menos 3:1', async () => {
      // WCAG 1.4.11: a barra só informa se for possível ver onde ela termina.
      await expect(contrastBarTrack(canvasElement)).toBeGreaterThanOrEqual(3);
    });
  },
};

export const Indeterminate: Story = {
  parameters: {
    covers: ['functional.item6'],
    docs: {
      // O valor OMITIDO é o assunto: nenhum atributo de valor no snippet.
      source: { transform: () => progressBarSnippet({ label: 'Processando…' }) },
    },
  },
  render: () => ({
    components: { Progress },
    template: `
      <div class="nds-w-md">
        <Progress aria-label="Processando…" />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Omitir o valor dá o indeterminado, e não zero', async () => {
      // Até 2026-09-14 o padrão desta stack era 0: uma barra vazia e parada,
      // anunciada como "0%", onde outras stacks mostravam o traço correndo.
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

    await step('Sem valor nenhuma property de posição é escrita', async () => {
      // Com `--value` escrita a folha manteria o indicador parado numa posição
      // fixa por baixo do ciclo.
      const indicador = indicadorDoProgresso(canvasElement);
      await expect(indicador.style.getPropertyValue('--value')).toBe('');
      await expect(indicador.getAttribute('style') ?? '').toBe('');
    });
  },
};

export const WithLabel: Story = {
  parameters: {
    covers: ['accessibility.item5'],
    docs: {
      source: { transform: progressWithLabelSource },
    },
  },
  render: () => ({
    components: { Progress },
    template: `
      <div class="nds-stack nds-w-md" data-spacing="xs">
        <div class="nds-cluster nds-text-body" data-justify="between">
          <span class="nds-text-foreground">Enviando arquivo</span>
          <span class="nds-text-muted-foreground nds-tabular-nums" aria-live="polite">42%</span>
        </div>
        <Progress :model-value="42" aria-label="Enviando arquivo" />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Label e value visíveis acima da barra', async () => {
      await expect(canvas.getByText('Enviando arquivo')).toBeVisible();
      await expect(canvas.getByText('42%')).toBeVisible();
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
  parameters: {
    docs: {
      source: { transform: progressSemanticColorSource },
    },
  },
  render: () => ({
    components: { Progress },
    template: `
      <div class="nds-stack nds-w-md" data-spacing="sm">
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
      // O contraste não pode depender de qual variante alguém escolheu.
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
