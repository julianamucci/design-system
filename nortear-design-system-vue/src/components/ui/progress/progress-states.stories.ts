import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, waitFor, within } from 'storybook/test';
import { createApp, onMounted, onUnmounted, ref } from 'vue';
import { Progress } from './index';
import {
  isAnimationRunning,
  indicadorAnimation,
  indicadorDoProgresso,
  enableReducedMotion,
  percentualDesenhado,
} from '@shared/testing/progress-probe';
import { PROGRESS_INDETERMINATE_TEXT } from '@shared/primitives/progress-value';
import { progressAnimatedSource, progressBarSnippet } from './progress.source';

const meta = {
  title: 'Components/Feedback/Progress/States',
  component: Progress,
  tags: ['feedback'],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: () => progressBarSnippet({ value: 0, label: 'Progresso do upload' }) },
      description: {
        component:
          'Estados derivados do valor: Default (mínimo), Loading (parcial), Complete (máximo) e Indeterminate (sem valor, com o traço em ciclo) — mais a barra que avança e o traço sob movimento reduzido.',
      },
    },
  },
} satisfies Meta<typeof Progress>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Dois quadros: o bastante para o layout e o estilo inicial assentarem. */
const twoFrames = () =>
  new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));

export const Default: Story = {
  parameters: { covers: ['functional.item1', 'visual.item1'] },
  render: () => ({
    components: { Progress },
    template: `
      <div class="nds-w-md">
        <Progress :model-value="0" aria-label="Progresso do upload" />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('value=0 anuncia zero e não desenha preenchimento', async () => {
      const bar = canvas.getByRole('progressbar');
      await expect(bar).toHaveAttribute('aria-valuenow', '0');
      await expect(bar).toHaveAttribute('aria-valuetext', '0%');
      await waitFor(async () => {
        await expect(percentualDesenhado(canvasElement)).toBeLessThan(1);
      });
    });

    await step('Zero não é o mesmo que indeterminate', async () => {
      // As duas telas são quase idênticas, mas só uma delas informa o progresso.
      await expect(canvas.getByRole('progressbar')).not.toHaveAttribute('data-indeterminate');
    });
  },
};

export const Loading: Story = {
  parameters: {
    covers: ['functional.item2', 'visual.item2'],
    docs: {
      source: { transform: () => progressBarSnippet({ value: 50, label: 'Carregando dados' }) },
    },
  },
  render: () => ({
    components: { Progress },
    template: `
      <div class="nds-w-md">
        <Progress :model-value="50" aria-label="Carregando dados" />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('value=50 preenche metade da trilha e anuncia 50%', async () => {
      const bar = canvas.getByRole('progressbar', { name: 'Carregando dados' });
      await expect(bar).toHaveAttribute('aria-valuenow', '50');
      await expect(bar).toHaveAttribute('aria-valuetext', '50%');
      await waitFor(async () => {
        await expect(Math.abs(percentualDesenhado(canvasElement) - 50)).toBeLessThan(2);
      });
    });

    await step('A metade sai de --value, e não de posição escrita à mão', async () => {
      const indicador = indicadorDoProgresso(canvasElement);
      await expect(indicador.style.getPropertyValue('--value')).toBe('50');
      await expect(indicador.style.transform).toBe('');
    });
  },
};

export const Complete: Story = {
  parameters: {
    covers: ['functional.item3', 'functional.item5', 'visual.item3'],
    docs: {
      source: { transform: () => progressBarSnippet({ value: 100, label: 'Concluído' }) },
    },
  },
  render: () => ({
    components: { Progress },
    template: `
      <div class="nds-w-md">
        <Progress :model-value="100" aria-label="Concluído" />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('value=100 preenche a trilha inteira', async () => {
      const bar = canvas.getByRole('progressbar', { name: 'Concluído' });
      await expect(bar).toHaveAttribute('aria-valuenow', '100');
      await expect(bar).toHaveAttribute('aria-valuetext', '100%');
      await waitFor(async () => {
        await expect(Math.abs(percentualDesenhado(canvasElement) - 100)).toBeLessThan(2);
      });
    });

    await step('A conclusão é um estado próprio no DOM', async () => {
      await expect(canvas.getByRole('progressbar')).toHaveAttribute('data-state', 'complete');
    });

    await step('Fora da faixa, o valor é limitado antes de anunciar e de desenhar', async () => {
      // Um valor acima do máximo anunciaria um número que a barra não desenha;
      // um negativo empurraria o indicador para fora da trilha. A barra de
      // prova é montada DENTRO do canvas, para o desenho ter layout de verdade.
      // Cada ponta com o próprio nome: duas barras homônimas no mesmo canvas
      // seriam indistinguíveis para quem navega por leitor de tela.
      for (const [requested, clamped, label] of [
        [140, 100, 'Acima do máximo'],
        [-20, 0, 'Abaixo do mínimo'],
      ] as const) {
        const host = document.createElement('div');
        host.className = 'nds-w-md';
        canvasElement.appendChild(host);
        const app = createApp(Progress, { modelValue: requested, 'aria-label': label });
        try {
          app.mount(host);
          await twoFrames();
          const bar = host.querySelector<HTMLElement>('[role="progressbar"]');
          await expect(bar?.getAttribute('aria-valuenow')).toBe(String(clamped));
          await expect(bar?.getAttribute('aria-valuetext')).toBe(`${clamped}%`);
          await expect(indicadorDoProgresso(host).style.getPropertyValue('--value')).toBe(String(clamped));
          await expect(Math.abs(percentualDesenhado(host) - clamped)).toBeLessThan(2);
        } finally {
          app.unmount();
          host.remove();
        }
      }
    });
  },
};

export const Indeterminate: Story = {
  parameters: {
    covers: ['functional.item4', 'visual.item4'],
    docs: {
      source: { transform: () => progressBarSnippet({ value: null, label: 'Processando…' }) },
    },
  },
  render: () => ({
    components: { Progress },
    template: `
      <div class="nds-w-md">
        <Progress :model-value="null" aria-label="Processando…" />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Sem valor, aria-valuenow some e o nome permanece', async () => {
      const bar = canvas.getByRole('progressbar', { name: 'Processando…' });
      await expect(bar).not.toHaveAttribute('aria-valuenow');
      await expect(bar).toHaveAttribute('data-indeterminate', '');
    });

    await step('A faixa sobrevive ao indeterminado (C2), e o texto diz em andamento', async () => {
      const bar = canvas.getByRole('progressbar');
      await expect(bar).toHaveAttribute('aria-valuemin', '0');
      await expect(bar).toHaveAttribute('aria-valuemax', '100');
      await expect(bar).toHaveAttribute('aria-valuetext', PROGRESS_INDETERMINATE_TEXT);
    });

    await step('O traço corre de verdade', async () => {
      // Medir POSIÇÃO no meio de uma animação infinita é racy por construção;
      // afirma-se a animação do design system pelo nome.
      await waitFor(async () => {
        await expect(indicadorAnimation(canvasElement)).toBe('nds-progress-indeterminate');
      });
    });

    await step('O traço é o do design system, não o de um homônimo', async () => {
      // O ciclo do design system desloca `margin-inline-start` e deixa
      // `transform` em `none`; um homônimo que animasse `transform` daria matriz.
      await expect(getComputedStyle(indicadorDoProgresso(canvasElement)).transform).toBe('none');
    });
  },
};

export const Animated: Story = {
  parameters: {
    docs: {
      source: { transform: progressAnimatedSource },
    },
  },
  render: () => ({
    components: { Progress },
    setup() {
      const value = ref(0);
      let timer: ReturnType<typeof setInterval> | undefined;
      onMounted(() => {
        timer = setInterval(() => {
          value.value = value.value >= 100 ? 0 : value.value + 5;
        }, 400);
      });
      onUnmounted(() => clearInterval(timer));
      return { value };
    },
    template: `
      <div class="nds-stack nds-w-md" data-spacing="xs">
        <div class="nds-cluster nds-text-body" data-justify="between">
          <span class="nds-text-foreground">Enviando arquivo</span>
          <span class="nds-text-muted-foreground nds-tabular-nums" aria-live="polite">{{ value }}%</span>
        </div>
        <Progress :model-value="value" aria-label="Progresso do upload" />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Progressbar animado presente e nomeado', async () => {
      const bar = canvas.getByRole('progressbar', { name: 'Progresso do upload' });
      await expect(bar).toHaveAttribute('aria-valuemin', '0');
      await expect(bar).toHaveAttribute('aria-valuemax', '100');
    });

    await step('O valor anunciado fica dentro da escala em toda rodada', async () => {
      // O valor muda a cada 400ms; afirmar um número seria racy.
      const agora = Number(canvas.getByRole('progressbar').getAttribute('aria-valuenow'));
      await expect(Number.isFinite(agora)).toBe(true);
      await expect(agora >= 0 && agora <= 100).toBe(true);
    });

    await step('O texto anunciado acompanha o número', async () => {
      // Os dois saem do mesmo render: lidos juntos, batem. Parado, o texto
      // diria "0%" o tempo todo enquanto o número anda.
      const bar = canvas.getByRole('progressbar');
      await expect(bar.getAttribute('aria-valuetext')).toBe(`${bar.getAttribute('aria-valuenow')}%`);
    });

    await step('O texto da porcentagem usa aria-live=polite', async () => {
      // `assertive` interromperia o leitor a cada 5% — é o par Do & Don't.
      const live = canvasElement.querySelector('[aria-live]');
      await expect(live).toHaveAttribute('aria-live', 'polite');
    });
  },
};

export const ReducedMotion: Story = {
  parameters: {
    covers: ['functional.item7'],
    docs: {
      // Não há prop nem atributo: a preferência é do sistema, e o snippet é a
      // barra indeterminada comum.
      source: { transform: () => progressBarSnippet({ label: 'Processando dados' }) },
    },
  },
  render: () => ({
    components: { Progress },
    template: `
      <div class="nds-w-md">
        <Progress aria-label="Processando dados" />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const indicador = indicadorDoProgresso(canvasElement);

    await step('Sem a preferência, o traço corre', async () => {
      await expect(canvas.getByRole('progressbar', { name: 'Processando dados' })).toHaveAttribute(
        'data-indeterminate',
        '',
      );
      await waitFor(async () => {
        await expect(isAnimationRunning(indicador)).toBe(true);
      });
    });

    // O desfazer roda no finally: a story seguinte e a foto do Chromatic não
    // herdam a marca.
    const desfazer = enableReducedMotion(canvasElement.ownerDocument);
    try {
      await step('Com movimento reduzido, o traço para', async () => {
        // A folha reage à marca na repintura seguinte: espera-se, só lendo.
        await waitFor(async () => {
          await expect(isAnimationRunning(indicador)).toBe(false);
        });
      });

      await step('O traço continua visível na trilha', async () => {
        await expect(indicador.getBoundingClientRect().width).toBeGreaterThan(0);
      });
    } finally {
      desfazer();
    }
  },
};
