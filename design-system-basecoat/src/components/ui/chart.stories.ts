import type { Meta, StoryObj } from '@storybook/html';
import { within, expect } from 'storybook/test';
import { createChart } from './chart';
import { createChartDocs } from '@/components/docs/ChartDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Shared data ──────────────────────────────────────────────────────────────

const chartData = [
  { label: 'Jan', value: 186 },
  { label: 'Feb', value: 305 },
  { label: 'Mar', value: 237 },
  { label: 'Apr', value: 73 },
  { label: 'May', value: 209 },
  { label: 'Jun', value: 214 },
];

// ─── Args type ────────────────────────────────────────────────────────────────

type ChartArgs = {
  type: 'bar' | 'line';
  height: number;
};

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta<ChartArgs> = {
  title: 'UI/Chart',
  component: createChart,
  tags: ['autodocs'],
  parameters: {
    docs: { page: withAutoDocsTab(createChartDocs) },
    layout: 'centered',
  },
  argTypes: {
    type: {
      control: 'select',
      options: ['bar', 'line'],
      description: 'Tipo do gráfico. Apenas bar e line são suportados no Basecoat.',
    },
    height: {
      control: { type: 'range', min: 100, max: 400, step: 10 },
      description: 'Altura do SVG em pixels.',
    },
  },
  args: {
    type: 'bar',
    height: 200,
  },
};

export default meta;
type Story = StoryObj<ChartArgs>;

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  render: (args) => {
    const wrap = document.createElement('div');
    wrap.className = 'w-full max-w-md';
    wrap.appendChild(
      createChart({
        data: chartData,
        type: args.type,
        height: args.height,
      }),
    );
    return wrap;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Container do gráfico está presente no DOM', async () => {
      const chart = canvasElement.querySelector('[data-slot="chart"]');
      await expect(chart).not.toBeNull();
    });

    await step('SVG acessível está presente', async () => {
      const svg = canvasElement.querySelector('svg[role="img"]');
      await expect(svg).not.toBeNull();
    });

    await step('SVG tem aria-label definido', async () => {
      const svg = canvasElement.querySelector('svg[role="img"]');
      await expect(svg?.getAttribute('aria-label')).toBeTruthy();
    });
  },
};
