import type { Meta, StoryObj } from '@storybook/html';
import { expect, waitFor } from 'storybook/test';
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
  type: 'bar' | 'line' | 'area' | 'pie';
  height: number;
};

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta<ChartArgs> = {
  title: 'UI/Chart',
  component: createChart as unknown as Meta<ChartArgs>['component'],
  tags: ['autodocs', 'display'],
  parameters: {
    docs: { page: withAutoDocsTab(createChartDocs) },
    layout: 'centered',
  },
  argTypes: {
    type: {
      control: 'select',
      options: ['bar', 'line', 'area', 'pie'],
      description: 'Tipo do gráfico (bar / line / area / pie).',
    },
    height: {
      control: { type: 'range', min: 100, max: 400, step: 10 },
      description: 'Altura do container em pixels.',
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
    wrap.className = 'nds-w-full nds-max-w-md';
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
    await step('Container .nds-chart presente no DOM', async () => {
      const container = canvasElement.querySelector('.nds-chart');
      await expect(container).not.toBeNull();
    });

    await step('ECharts terminou de renderizar (svg ou canvas dentro)', async () => {
      await waitFor(() => {
        const rendered = canvasElement.querySelector('.nds-chart svg, .nds-chart canvas');
        expect(rendered).not.toBeNull();
      }, { timeout: 2000 });
    });
  },
};
