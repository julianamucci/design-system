import type { Meta, StoryObj } from '@storybook/svelte';

import { within, expect } from 'storybook/test';
import ProgressStory from './ProgressStory.svelte';

const meta = {
  title: 'UI/Progress/Estados',
  component: ProgressStory,
  tags: ['feedback'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Estados do Progress — default (0), loading (intermediário), complete (100) e indeterminate (null).',
      },
    },
  },
} satisfies Meta<typeof ProgressStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    value: 0,
    'aria-label': 'Progresso',
  },
  parameters: {
    docs: {
      description: {
        story: 'value=0 — estado inicial, indicador em 0% (barra vazia).',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('aria-valuenow=0', async () => {
      const bar = canvas.getByRole('progressbar');
      await expect(bar).toHaveAttribute('aria-valuenow', '0');
    });
  },
};

export const Loading: Story = {
  args: {
    value: 50,
    'aria-label': 'Carregando dados',
  },
  parameters: {
    docs: {
      description: {
        story: 'value=50 — em progresso, indicador preenchido pela metade.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('aria-valuenow=50', async () => {
      const bar = canvas.getByRole('progressbar');
      await expect(bar).toHaveAttribute('aria-valuenow', '50');
    });
  },
};

export const Complete: Story = {
  args: {
    value: 100,
    'aria-label': 'Concluído',
    class: '[&>div]:bg-success',
  },
  parameters: {
    docs: {
      description: {
        story:
          'value=100 — finalizado, barra cheia. Considere remover ou trocar por mensagem de sucesso após conclusão.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('aria-valuenow=100', async () => {
      const bar = canvas.getByRole('progressbar');
      await expect(bar).toHaveAttribute('aria-valuenow', '100');
    });
  },
};

export const Indeterminate: Story = {
  args: {
    value: null,
    'aria-label': 'Processando…',
    class: '[&>div]:animate-indeterminate',
  },
  parameters: {
    docs: {
      description: {
        story:
          'value=null — sem valor definido, animação infinita no indicador via CSS (classe animate-indeterminate).',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('role=progressbar sem aria-valuenow', async () => {
      const bar = canvas.getByRole('progressbar');
      await expect(bar).toBeInTheDocument();
      await expect(bar).not.toHaveAttribute('aria-valuenow');
    });
  },
};
