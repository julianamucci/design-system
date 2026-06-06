import type { Meta, StoryObj } from '@storybook/svelte';
import { expect, waitFor } from 'storybook/test';
import { ChartContainer, buildBarOption } from './index';
import ChartDocs from '@/components/docs/ChartDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const chartData = [
  { label: 'Jan', value: 186 }, { label: 'Feb', value: 305 },
  { label: 'Mar', value: 237 }, { label: 'Apr', value: 73 },
  { label: 'May', value: 209 }, { label: 'Jun', value: 214 },
];

const meta = {
  title: 'UI/Chart',
  component: ChartContainer,
  tags: ['autodocs', 'display'],
  parameters: {
    layout: 'centered',
    docs: { page: withAutoDocsTab(ChartDocs) },
  },
  argTypes: {
    class: { control: 'text', description: 'Classes Tailwind (use h-[300px] w-[500px]).' },
    renderer: { control: 'select', options: ['svg', 'canvas'] },
  },
  args: {
    class: 'h-[300px] w-[500px]',
    renderer: 'svg' as const,
    option: buildBarOption({ data: chartData, title: 'Acessos mensais' }),
  },
} satisfies Meta<typeof ChartContainer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  play: async ({ canvasElement, step }) => {
    await step('ECharts renderiza SVG ou canvas', async () => {
      await waitFor(() => {
        const node = canvasElement.querySelector('[data-slot=chart] svg, [data-slot=chart] canvas');
        expect(node).not.toBeNull();
      }, { timeout: 2000 });
    });
  },
};
