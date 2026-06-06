import type { Meta, StoryObj } from '@storybook/vue3';
import { expect } from 'storybook/test';
import { Progress } from './index';

const meta = {
  title: 'UI/Progress/Estados',
  component: Progress,
  tags: ['feedback'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Estados do Progress: Default (value=0), Loading (0<value<100), Complete (value=100) e Indeterminate (value=null com animação infinita).',
      },
    },
  },
} satisfies Meta<typeof Progress>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components: { Progress },
    template: `
      <div class="w-[360px]">
        <Progress :model-value="0" aria-label="Progresso do upload" />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('aria-valuenow=0', async () => {
      const progress = canvasElement.querySelector('[data-slot="progress"]');
      await expect(progress).toHaveAttribute('aria-valuenow', '0');
    });

    await step('Indicator translateX(-100%) — vazio', async () => {
      const indicator = canvasElement.querySelector('[data-slot="progress-indicator"]') as HTMLElement;
      await expect(indicator.getAttribute('style') ?? '').toContain('translateX(-100%)');
    });
  },
};

export const Loading: Story = {
  render: () => ({
    components: { Progress },
    template: `
      <div class="w-[360px] space-y-1.5">
        <div class="flex items-center justify-between text-sm">
          <span class="text-foreground">Carregando dados</span>
          <span class="text-muted-foreground tabular-nums" aria-live="polite">50%</span>
        </div>
        <Progress :model-value="50" aria-label="Progresso do carregamento" />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('aria-valuenow=50', async () => {
      const progress = canvasElement.querySelector('[data-slot="progress"]');
      await expect(progress).toHaveAttribute('aria-valuenow', '50');
    });

    await step('Indicator preenchido pela metade', async () => {
      const indicator = canvasElement.querySelector('[data-slot="progress-indicator"]') as HTMLElement;
      await expect(indicator.getAttribute('style') ?? '').toContain('translateX(-50%)');
    });
  },
};

export const Complete: Story = {
  render: () => ({
    components: { Progress },
    template: `
      <div class="w-[360px] space-y-1.5">
        <div class="flex items-center justify-between text-sm">
          <span class="text-foreground">Concluído</span>
          <span class="text-muted-foreground tabular-nums">100%</span>
        </div>
        <Progress :model-value="100" aria-label="Operação concluída" />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('aria-valuenow=100', async () => {
      const progress = canvasElement.querySelector('[data-slot="progress"]');
      await expect(progress).toHaveAttribute('aria-valuenow', '100');
    });

    await step('Indicator totalmente preenchido — translateX(-0%)', async () => {
      const indicator = canvasElement.querySelector('[data-slot="progress-indicator"]') as HTMLElement;
      const style = indicator.getAttribute('style') ?? '';
      await expect(style.includes('translateX(-0%)') || style.includes('translateX(0%)')).toBe(true);
    });
  },
};

export const Indeterminate: Story = {
  render: () => ({
    components: { Progress },
    template: `
      <div class="w-[360px] space-y-1.5">
        <div class="text-sm text-foreground">Processando…</div>
        <Progress
          :model-value="null"
          class="[&>div]:animate-indeterminate"
          aria-label="Processando dados"
        />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('Sem aria-valuenow (indeterminate)', async () => {
      const progress = canvasElement.querySelector('[data-slot="progress"]');
      await expect(progress).not.toHaveAttribute('aria-valuenow');
    });

    await step('Classe animate-indeterminate presente', async () => {
      const progress = canvasElement.querySelector('[data-slot="progress"]') as HTMLElement;
      await expect(progress.className).toContain('animate-indeterminate');
    });

    await step('Indicator sem estilo transform inline', async () => {
      const indicator = canvasElement.querySelector('[data-slot="progress-indicator"]') as HTMLElement;
      const style = indicator.getAttribute('style') ?? '';
      await expect(style).not.toContain('translateX');
    });
  },
};
