import type { Meta, StoryObj } from '@storybook/vue3';
import { expect, waitFor } from 'storybook/test';
import { h } from 'vue';
import { ChartContainer, buildBarOption } from './index';
import ChartDocs from '@/components/docs/ChartDocs.vue';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const chartData = [
  { label: 'Jan', value: 186 },
  { label: 'Feb', value: 305 },
  { label: 'Mar', value: 237 },
  { label: 'Apr', value: 73 },
  { label: 'May', value: 209 },
  { label: 'Jun', value: 214 },
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
    class: { control: 'text', description: 'Classes Tailwind extras (use h-[300px] w-full).' },
    renderer: { control: 'select', options: ['svg', 'canvas'] },
  },
  args: {
    class: 'h-[300px] w-[500px]',
    renderer: 'svg' as const,
  },
} satisfies Meta<typeof ChartContainer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    option: buildBarOption({ data: chartData, title: 'Acessos mensais' }),
  },
  render: (args) => h(ChartContainer, { ...args, 'aria-label': 'Gráfico de barras' }),
  play: async ({ canvasElement, step }) => {
    await step('ECharts renderiza SVG ou canvas', async () => {
      await waitFor(() => {
        const node = canvasElement.querySelector('[data-slot=chart] svg, [data-slot=chart] canvas');
        expect(node).not.toBeNull();
      }, { timeout: 2000 });
    });
  },
};
