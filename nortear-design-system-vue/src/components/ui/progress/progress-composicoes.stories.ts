import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect } from 'storybook/test';
import { ref, onMounted, onUnmounted } from 'vue';
import { Progress } from './index';

const meta = {
  title: 'UI/Progress/Compositions',
  component: Progress,
  tags: ['feedback'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Composicoes reais do Progress: upload com porcentagem animada, múltiplos progressos em lista, cor customizada via [&>div]:bg-* e indeterminate para operações sem progresso mensurável.',
      },
    },
  },
} satisfies Meta<typeof Progress>;

export default meta;
type Story = StoryObj<typeof meta>;

export const UploadAnimado: Story = {
  render: () => ({
    components: { Progress },
    setup() {
      const value = ref(0);
      let timer: ReturnType<typeof setInterval> | null = null;
      onMounted(() => {
        timer = setInterval(() => {
          value.value = value.value >= 100 ? 0 : value.value + 4;
        }, 250);
      });
      onUnmounted(() => {
        if (timer) { clearInterval(timer); timer = null; }
      });
      return { value };
    },
    template: `
      <div class="" data-spacing="xs" style="width: 360px">
        <div class="nds-cluster nds-text-body" data-align="center" data-justify="between">
          <span class="nds-text-foreground">Enviando arquivo</span>
          <span class="nds-text-muted-foreground tabular-nums" aria-live="polite">{{ value }}%</span>
        </div>
        <Progress :model-value="value" aria-label="Progresso do upload" />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('Progress presente com role=progressbar', async () => {
      const progress = canvasElement.querySelector('[data-slot="progress"]');
      await expect(progress).toBeInTheDocument();
      await expect(progress).toHaveAttribute('role', 'progressbar');
    });

    await step('aria-label descreve a operação', async () => {
      const progress = canvasElement.querySelector('[data-slot="progress"]');
      await expect(progress).toHaveAttribute('aria-label', 'Progresso do upload');
    });

    await step('Texto da porcentagem usa aria-live=polite', async () => {
      const live = canvasElement.querySelector('[aria-live="polite"]');
      await expect(live).toBeInTheDocument();
    });
  },
};

export const ProgressList: Story = {
  render: () => ({
    components: { Progress },
    setup() {
      const items = [
        { name: 'relatorio-final.pdf', value: 92, label: 'Progresso do upload de relatorio-final.pdf' },
        { name: 'planilha-q4.xlsx',    value: 64, label: 'Progresso do upload de planilha-q4.xlsx'    },
        { name: 'imagens.zip',         value: 28, label: 'Progresso do upload de imagens.zip'         },
      ];
      return { items };
    },
    template: `
      <ul class="m-0 nds-p-0 nds-list-none" data-spacing="md" style="width: 400px">
        <li v-for="item in items" :key="item.name" class="" data-spacing="xs">
          <div class="nds-cluster nds-text-body" data-align="center" data-justify="between">
            <span class="nds-text-foreground nds-truncate">{{ item.name }}</span>
            <span class="nds-text-muted-foreground tabular-nums">{{ item.value }}%</span>
          </div>
          <Progress :model-value="item.value" :aria-label="item.label" />
        </li>
      </ul>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('3 progressbars renderizados', async () => {
      const bars = canvasElement.querySelectorAll('[role="progressbar"]');
      await expect(bars.length).toBe(3);
    });

    await step('Cada um com aria-label próprio', async () => {
      const bars = canvasElement.querySelectorAll('[role="progressbar"]');
      for (const bar of Array.from(bars)) {
        const label = bar.getAttribute('aria-label') ?? '';
        await expect(label.length).toBeGreaterThan(0);
      }
    });

    await step('aria-valuenow distintos (92, 64, 28)', async () => {
      const bars = canvasElement.querySelectorAll('[role="progressbar"]');
      const values = Array.from(bars).map(b => b.getAttribute('aria-valuenow'));
      await expect(values).toEqual(['92', '64', '28']);
    });
  },
};

export const CorCustomizada: Story = {
  render: () => ({
    components: { Progress },
    template: `
      <div class="" data-spacing="sm" style="width: 360px">
        <div class="" data-spacing="xs">
          <div class="nds-cluster nds-text-body" data-align="center" data-justify="between">
            <span class="nds-text-foreground">Espaço usado</span>
            <span class="nds-text-muted-foreground tabular-nums">75%</span>
          </div>
          <Progress
            :model-value="75"
            class="[&>div]:bg-success"
            aria-label="Espaço de armazenamento usado"
          />
        </div>
        <div class="" data-spacing="xs">
          <div class="nds-cluster nds-text-body" data-align="center" data-justify="between">
            <span class="nds-text-foreground">Quota</span>
            <span class="nds-text-muted-foreground tabular-nums">90%</span>
          </div>
          <Progress
            :model-value="90"
            class="[&>div]:bg-warning"
            aria-label="Quota de uso"
          />
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('Cor customizada via arbitrary variant aplicada', async () => {
      const bars = canvasElement.querySelectorAll('[data-slot="progress"]');
      await expect(bars.length).toBe(2);
      await expect((bars[0] as HTMLElement).className).toContain('[&>div]:bg-success');
      await expect((bars[1] as HTMLElement).className).toContain('[&>div]:bg-warning');
    });

    await step('aria-label presente em todos', async () => {
      const bars = canvasElement.querySelectorAll('[role="progressbar"]');
      for (const bar of Array.from(bars)) {
        await expect(bar).toHaveAttribute('aria-label');
      }
    });
  },
};

export const IndeterminateProcessing: Story = {
  render: () => ({
    components: { Progress },
    template: `
      <div class="" data-spacing="xs" style="width: 360px">
        <div class="nds-text-body">Processando…</div>
        <Progress
          :model-value="null"
          class="[&>div]:animate-indeterminate"
          aria-label="Processando dados do servidor"
        />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('role=progressbar presente sem aria-valuenow', async () => {
      const progress = canvasElement.querySelector('[role="progressbar"]');
      await expect(progress).toBeInTheDocument();
      await expect(progress).not.toHaveAttribute('aria-valuenow');
    });

    await step('Classe animate-indeterminate aplicada', async () => {
      const progress = canvasElement.querySelector('[data-slot="progress"]') as HTMLElement;
      await expect(progress.className).toContain('animate-indeterminate');
    });

    await step('Sem inline style transform no indicator', async () => {
      const indicator = canvasElement.querySelector('[data-slot="progress-indicator"]') as HTMLElement;
      const style = indicator.getAttribute('style') ?? '';
      await expect(style).not.toContain('translateX');
    });
  },
};
