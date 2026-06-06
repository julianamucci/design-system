import type { Meta, StoryObj } from '@storybook/svelte';

import { within, expect } from 'storybook/test';
import { Progress } from './index';
import ProgressStory from './ProgressStory.svelte';
import ProgressDocs from '@/components/docs/ProgressDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const meta = {
  title: 'UI/Progress',
  component: Progress,
  tags: ['autodocs', 'feedback'],
  parameters: {
    layout: 'centered',
    docs: {
      page: withAutoDocsTab(ProgressDocs),
      description: {
        component:
          'Indicador visual de progresso de operações com duração mensurável. Suporta modo determinate (value 0–100) e indeterminate (value=null).',
      },
    },
  },
  argTypes: {
    value: {
      control: { type: 'number', min: 0, max: 100, step: 1 },
      description: 'Valor atual de 0 a 100. null ativa modo indeterminate.',
    },
    max: {
      control: { type: 'number' },
      description: 'Valor máximo da escala.',
    },
    class: {
      control: { type: 'text' },
      description: 'Classes Tailwind adicionais (ex: [&>div]:bg-success).',
    },
  },
  args: {
    value: 42,
    max: 100,
  },
} satisfies Meta<typeof Progress>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => ({
    Component: ProgressStory,
    props: {
      value: args.value,
      max: args.max,
      class: args.class,
      'aria-label': 'Progresso do upload',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('role=progressbar presente', async () => {
      const bar = canvas.getByRole('progressbar');
      await expect(bar).toBeInTheDocument();
    });

    await step('aria-label presente', async () => {
      const bar = canvas.getByRole('progressbar');
      await expect(bar).toHaveAttribute('aria-label', 'Progresso do upload');
    });

    await step('data-slot=progress aplicado', async () => {
      const bar = canvasElement.querySelector('[data-slot="progress"]');
      await expect(bar).toBeInTheDocument();
    });

    await step('Indicador interno renderizado', async () => {
      const indicator = canvasElement.querySelector('[data-slot="progress-indicator"]');
      await expect(indicator).toBeInTheDocument();
    });
  },
};
