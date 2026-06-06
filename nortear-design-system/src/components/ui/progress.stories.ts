import type { Meta, StoryObj } from '@storybook/html';
import { within, expect } from 'storybook/test';
import { createProgress } from './progress';
import { createProgressDocs } from '@/components/docs/ProgressDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────

type ProgressArgs = {
  value: number;
  max: number;
  ariaLabel: string;
};

const meta: Meta<ProgressArgs> = {
  title: 'UI/Progress',
  tags: ['autodocs', 'feedback'],
  parameters: {
    layout: 'padded',
    docs: { page: withAutoDocsTab(createProgressDocs) },
  },
  argTypes: {
    value: {
      control: { type: 'range', min: 0, max: 100, step: 1 },
      description: 'Valor atual (0–max).',
    },
    max: {
      control: { type: 'number', min: 1 },
      description: 'Valor máximo da escala.',
    },
    ariaLabel: {
      control: 'text',
      description: 'Texto descrevendo o que está sendo medido. Obrigatório — setado pela aplicação via setAttribute.',
    },
  },
  args: {
    value: 42,
    max: 100,
    ariaLabel: 'Progresso do upload',
  },
};

export default meta;
type Story = StoryObj<ProgressArgs>;

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  render: (args) => {
    const container = document.createElement('div');
    container.className = 'nds-w-full nds-max-w-md';
    const bar = createProgress({ value: args.value, max: args.max });
    bar.setAttribute('aria-label', args.ariaLabel);
    container.appendChild(bar);
    return container;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('role="progressbar" presente', async () => {
      await expect(canvas.getByRole('progressbar')).toBeInTheDocument();
    });

    await step('aria-valuenow reflete value', async () => {
      const bar = canvas.getByRole('progressbar');
      await expect(bar).toHaveAttribute('aria-valuenow', '42');
    });

    await step('aria-valuemin e aria-valuemax presentes', async () => {
      const bar = canvas.getByRole('progressbar');
      await expect(bar).toHaveAttribute('aria-valuemin', '0');
      await expect(bar).toHaveAttribute('aria-valuemax', '100');
    });

    await step('aria-label setado pela aplicação', async () => {
      const bar = canvas.getByRole('progressbar');
      await expect(bar).toHaveAttribute('aria-label', 'Progresso do upload');
    });
  },
};
