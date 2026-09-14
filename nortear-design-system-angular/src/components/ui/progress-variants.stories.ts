import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, waitFor } from 'storybook/test';
import { NDS_PROGRESS } from './progress';
import {
  progressDeterminateSource,
  progressIndeterminateSource,
  progressSemanticColorSource,
  progressWithLabelSource,
} from './progress.source';
import {
  barrasDeProgresso,
  contrastBarTrack,
  indicadorDoProgresso,
  accessibleName,
  percentualDesenhado,
} from '@shared/testing/progress-probe';
import { PROGRESS_INDETERMINATE_TEXT } from '@shared/primitives/progress-value';

// O contraste entre indicador e trilha é medido, não presumido: a trilha é o
// primário a 20% de opacidade, então o valor real depende do que está ATRÁS
// dela. A composição e a conta moram no colhedor compartilhado.

const meta: Meta = {
  title: 'Components/Feedback/Progress/Variants',
  tags: ['feedback'],
  decorators: [moduleMetadata({ imports: [...NDS_PROGRESS] })],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'As formas de uso: valor conhecido, valor desconhecido, valor com rótulo e cor semântica. ' +
          'Rótulo e valor formatado são partes do próprio componente — não texto solto ao lado.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Determinate: Story = {
  parameters: {
    covers: ['accessibility.item2'],
    docs: { source: { transform: progressDeterminateSource } },
  },
  render: () => ({
    template: `
      <div class="nds-w-md">
        <div ndsProgress [value]="42" aria-label="Progresso do upload">
          <div ndsProgressTrack>
            <div ndsProgressIndicator></div>
          </div>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O valor conhecido é anunciado e desenhado', async () => {
      const bar = canvas.getByRole('progressbar');
      await expect(bar).toHaveAttribute('aria-valuenow', '42');
      await waitFor(() => expect(bar.getAttribute('aria-valuetext')).toBe('42%'));
      const indicador = indicadorDoProgresso(canvasElement);
      await expect(indicador.style.getPropertyValue('--value')).toBe('42');
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
    covers: ['functional.item6'],
    docs: {
      source: { transform: progressIndeterminateSource },
      description: {
        story:
          'Sem valor — o valor OMITIDO, como no `<progress>` nativo — a barra é indeterminada: ' +
          '`aria-valuenow` some, a escala continua anunciada e o texto é "Em andamento".',
      },
    },
  },
  render: () => ({
    template: `
      <div class="nds-w-md">
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

    await step('Valor omitido não vira valor zero', async () => {
      const bar = canvas.getByRole('progressbar', { name: 'Processando…' });
      await expect(bar).not.toHaveAttribute('aria-valuenow');
      await expect(bar).toHaveAttribute('data-indeterminate', '');
    });

    await step('A escala sobrevive sem o valor', async () => {
      const bar = canvas.getByRole('progressbar');
      await expect(bar).toHaveAttribute('aria-valuemin', '0');
      await expect(bar).toHaveAttribute('aria-valuemax', '100');
    });

    await step('O texto anunciado é o do design system, não a frase da lib', async () => {
      // A lib escreve "indeterminate progress", em inglês e fixo.
      const bar = canvas.getByRole('progressbar');
      await waitFor(() =>
        expect(bar.getAttribute('aria-valuetext')).toBe(PROGRESS_INDETERMINATE_TEXT),
      );
    });

    await step('Sem valor não há --value para o CSS consumir', async () => {
      const indicador = indicadorDoProgresso(canvasElement);
      await expect(indicador.style.getPropertyValue('--value')).toBe('');
    });
  },
};

export const WithLabel: Story = {
  parameters: {
    covers: ['accessibility.item5'],
    docs: { source: { transform: progressWithLabelSource } },
  },
  render: () => ({
    template: `
      <div class="nds-w-md">
        <div ndsProgress [value]="42">
          <span ndsProgressLabel>Enviando arquivo</span>
          <span ndsProgressValue></span>
          <div ndsProgressTrack>
            <div ndsProgressIndicator></div>
          </div>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O rótulo visível vira o nome acessível da barra', async () => {
      // Com rótulo presente, o nome sai de `aria-labelledby` — por isso o
      // critério fala em NOME ACESSÍVEL, e não em `aria-label`.
      const bar = canvas.getByRole('progressbar', { name: 'Enviando arquivo' });
      const label = canvasElement.querySelector<HTMLElement>('.nds-progress-label')!;
      await expect(bar.getAttribute('aria-labelledby')).toBe(label.id);
    });

    await step('Toda barra da tela tem nome acessível', async () => {
      for (const bar of barrasDeProgresso(canvasElement)) {
        await expect(accessibleName(bar)).not.toBe('');
      }
    });

    await step('O valor visível é o mesmo texto que a raiz anuncia', async () => {
      const bar = canvas.getByRole('progressbar');
      const value = canvasElement.querySelector<HTMLElement>('.nds-progress-value')!;
      await waitFor(() => expect(value.textContent?.trim()).toBe('42%'));
      await expect(bar.getAttribute('aria-valuetext')).toBe('42%');
    });

    await step('O valor visível não é lido duas vezes', async () => {
      const value = canvasElement.querySelector<HTMLElement>('.nds-progress-value')!;
      await expect(value).toHaveAttribute('aria-hidden', 'true');
    });
  },
};

export const SemanticColor: Story = {
  parameters: {
    docs: {
      source: { transform: progressSemanticColorSource },
      description: {
        story:
          '`data-variant` troca a cor da barra; a trilha continua neutra, para o contraste ' +
          'não depender da variante escolhida.',
      },
    },
  },
  render: () => ({
    template: `
      <div class="nds-stack nds-w-md" data-spacing="sm">
        <div ndsProgress [value]="100" data-variant="success" aria-label="Sincronização concluída">
          <div ndsProgressTrack>
            <div ndsProgressIndicator></div>
          </div>
        </div>
        <div
          ndsProgress
          [value]="92"
          data-variant="destructive"
          aria-label="Espaço de armazenamento quase esgotado"
        >
          <div ndsProgressTrack>
            <div ndsProgressIndicator></div>
          </div>
        </div>
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
