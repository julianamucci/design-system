import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, waitFor } from 'storybook/test';
import { NDS_PROGRESS } from './progress';

/** Percentual efetivamente DESENHADO, medido no DOM. */
function percentualDesenhado(raiz: HTMLElement): number {
  const trilha = raiz.querySelector<HTMLElement>('[data-slot="progress-track"]')!;
  const indicador = raiz.querySelector<HTMLElement>('[data-slot="progress-indicator"]')!;
  const caixa = trilha.getBoundingClientRect();
  return ((indicador.getBoundingClientRect().right - caixa.left) / caixa.width) * 100;
}

const meta: Meta = {
  title: 'UI/Progress/States',
  decorators: [moduleMetadata({ imports: [...NDS_PROGRESS] })],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Estados derivados do valor: default (0), loading (parcial), complete (100) e ' +
          'indeterminate (sem valor). O estado é do primitivo — chega ao DOM em ' +
          '`data-progressing`, `data-complete` e `data-indeterminate`.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  parameters: { covers: ['functional.item1', 'visual.item1'] },
  render: () => ({
    template: `
      <div class="nds-w-full nds-max-w-md">
        <div ndsProgress [value]="0" aria-label="Progresso do upload">
          <div ndsProgressTrack>
            <div ndsProgressIndicator></div>
          </div>
        </div>
      </div>
    `,
  }),
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
      const bar = canvas.getByRole('progressbar');
      await expect(bar).not.toHaveAttribute('data-indeterminate');
      await expect(bar).toHaveAttribute('data-progressing', '');
    });
  },
};

export const Loading: Story = {
  parameters: { covers: ['functional.item2', 'visual.item2'] },
  render: () => ({
    template: `
      <div class="nds-w-full nds-max-w-md">
        <div ndsProgress [value]="50" aria-label="Carregando dados">
          <div ndsProgressTrack>
            <div ndsProgressIndicator></div>
          </div>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('value=50 preenche metade da trilha', async () => {
      await expect(canvas.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50');
      await waitFor(async () => {
        await expect(Math.abs(percentualDesenhado(canvasElement) - 50)).toBeLessThan(2);
      });
    });

    await step('A metade sai de --value, não de largura escrita à mão', async () => {
      const indicador = canvasElement.querySelector<HTMLElement>(
        '[data-slot="progress-indicator"]',
      )!;
      await expect(indicador.style.getPropertyValue('--value')).toBe('50');
      await expect(indicador.style.width).toBe('');
    });
  },
};

export const Complete: Story = {
  parameters: { covers: ['functional.item3', 'visual.item3'] },
  render: () => ({
    template: `
      <div class="nds-w-full nds-max-w-md">
        <div ndsProgress [value]="100" aria-label="Concluído">
          <div ndsProgressTrack>
            <div ndsProgressIndicator></div>
          </div>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('value=100 preenche a trilha inteira', async () => {
      await expect(canvas.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
      await waitFor(async () => {
        await expect(Math.abs(percentualDesenhado(canvasElement) - 100)).toBeLessThan(2);
      });
    });

    await step('A conclusão é um estado próprio no DOM', async () => {
      // `data-complete` é o gancho de quem quer trocar cor ou remover a barra
      // ao fim — sem ele, o consumidor teria que comparar value com max.
      const bar = canvas.getByRole('progressbar');
      await expect(bar).toHaveAttribute('data-complete', '');
      await expect(bar).not.toHaveAttribute('data-progressing');
    });
  },
};

export const Indeterminate: Story = {
  parameters: {
    covers: ['functional.item4', 'visual.item4'],
    docs: {
      description: {
        story:
          'Sem `value` o progresso é indeterminate. O CSS compartilhado ainda não tem regra ' +
          'de animação para `[data-indeterminate]`, então a barra fica vazia em vez de correr — ' +
          'o estado existe no DOM e no anúncio, falta o desenho.',
      },
    },
  },
  render: () => ({
    template: `
      <div class="nds-w-full nds-max-w-md">
        <div ndsProgress aria-label="Processando…">
          <div ndsProgressTrack>
            <div ndsProgressIndicator></div>
          </div>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Sem valor, aria-valuenow some e o nome permanece', async () => {
      // Um `aria-valuenow` fixo em 0 mentiria: diria "zero por cento" quando a
      // verdade é "não sei quanto falta".
      const bar = canvas.getByRole('progressbar', { name: 'Processando…' });
      await expect(bar).not.toHaveAttribute('aria-valuenow');
      await expect(bar).toHaveAttribute('aria-valuemin', '0');
      await expect(bar).toHaveAttribute('aria-valuemax', '100');
    });

    await step('O estado indeterminate chega às três partes', async () => {
      for (const slot of ['progress', 'progress-track', 'progress-indicator']) {
        const parte = canvasElement.querySelector<HTMLElement>(`[data-slot="${slot}"]`)!;
        await expect(parte).toHaveAttribute('data-indeterminate', '');
      }
    });

    await step('Sem valor não há --value para o CSS consumir', async () => {
      const indicador = canvasElement.querySelector<HTMLElement>(
        '[data-slot="progress-indicator"]',
      )!;
      await expect(indicador.style.getPropertyValue('--value')).toBe('');
    });
  },
};
