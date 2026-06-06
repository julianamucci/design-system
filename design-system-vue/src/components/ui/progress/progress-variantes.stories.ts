import type { Meta, StoryObj } from '@storybook/vue3';
import { expect } from 'storybook/test';
import { Progress } from './index';

const meta = {
  title: 'UI/Progress/Variantes',
  component: Progress,
  tags: ['feedback'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Variantes do Progress: Determinate (value 0–100), Indeterminate (value=null + [&>div]:animate-indeterminate) e With label (Label + Value acima da trilha).',
      },
    },
  },
} satisfies Meta<typeof Progress>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Determinate: Story = {
  render: () => ({
    components: { Progress },
    template: `
      <div class="w-[360px]">
        <Progress :model-value="50" aria-label="Progresso do upload" />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('Progress renderiza com aria-valuenow=50', async () => {
      const progress = canvasElement.querySelector('[data-slot="progress"]');
      await expect(progress).toBeInTheDocument();
      await expect(progress).toHaveAttribute('aria-valuenow', '50');
    });

    await step('Indicator aplica transform translateX(-50%)', async () => {
      const indicator = canvasElement.querySelector('[data-slot="progress-indicator"]') as HTMLElement;
      await expect(indicator).toBeInTheDocument();
      await expect(indicator.getAttribute('style') ?? '').toContain('translateX(-50%)');
    });
  },
};

export const Indeterminate: Story = {
  render: () => ({
    components: { Progress },
    template: `
      <div class="w-[360px]">
        <Progress
          :model-value="null"
          class="[&>div]:animate-indeterminate"
          aria-label="Processando dados"
        />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('Progress renderiza sem aria-valuenow (indeterminate)', async () => {
      const progress = canvasElement.querySelector('[data-slot="progress"]');
      await expect(progress).toBeInTheDocument();
      await expect(progress).not.toHaveAttribute('aria-valuenow');
    });

    await step('Classe animate-indeterminate aplicada via arbitrary variant', async () => {
      const progress = canvasElement.querySelector('[data-slot="progress"]') as HTMLElement;
      await expect(progress.className).toContain('[&>div]:animate-indeterminate');
    });

    await step('aria-label descreve a operação', async () => {
      const progress = canvasElement.querySelector('[data-slot="progress"]');
      await expect(progress).toHaveAttribute('aria-label', 'Processando dados');
    });
  },
};

export const WithLabel: Story = {
  render: () => ({
    components: { Progress },
    template: `
      <div class="w-[360px] space-y-1.5">
        <div class="flex items-center justify-between text-sm">
          <span class="text-foreground">Enviando arquivo</span>
          <span class="text-muted-foreground tabular-nums" aria-live="polite">42%</span>
        </div>
        <Progress :model-value="42" aria-label="Progresso do upload" />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('Label textual visível acima da trilha', async () => {
      const label = canvasElement.querySelector('span.text-foreground');
      await expect(label?.textContent).toBe('Enviando arquivo');
    });

    await step('Value 42% com aria-live polite', async () => {
      const value = canvasElement.querySelector('[aria-live="polite"]');
      await expect(value).toBeInTheDocument();
      await expect(value?.textContent).toBe('42%');
    });

    await step('aria-valuenow=42', async () => {
      const progress = canvasElement.querySelector('[data-slot="progress"]');
      await expect(progress).toHaveAttribute('aria-valuenow', '42');
    });
  },
};
