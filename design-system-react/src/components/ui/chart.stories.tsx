import type { Meta, StoryObj } from '@storybook/react';
import { expect, waitFor } from 'storybook/test';
import { ChartContainer, buildBarOption } from './chart';
import { ChartDocs } from '@/components/docs/ChartDocs';
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
    docs: { page: withAutoDocsTab(ChartDocs) },
    layout: 'centered',
  },
  argTypes: {
    className: {
      control: 'text',
      description: 'Classes Tailwind extras (use h-[300px] w-[500px] p/ controlar tamanho).',
    },
    renderer: {
      control: 'select',
      options: ['svg', 'canvas'],
      description: 'SVG (default) é melhor pra print/docs; canvas pra alta performance.',
    },
  },
  args: {
    className: 'h-[300px] w-[500px]',
    renderer: 'svg',
  },
} satisfies Meta<typeof ChartContainer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    option: buildBarOption({ data: chartData, title: 'Acessos mensais' }),
  },
  render: (args) => (
    <ChartContainer
      {...args}
      aria-label="Gráfico de barras: acessos mensais"
    />
  ),
  play: async ({ canvasElement, step }) => {
    await step('ChartContainer renderiza com data-slot=chart', async () => {
      const chart = canvasElement.querySelector('[data-slot=chart]');
      await expect(chart).toBeInTheDocument();
    });
    await step('aria-label presente para acessibilidade', async () => {
      const chart = canvasElement.querySelector('[data-slot=chart]');
      await expect(chart).toHaveAttribute('aria-label');
    });
    await step('ECharts renderiza SVG ou canvas dentro', async () => {
      await waitFor(() => {
        const rendered = canvasElement.querySelector('[data-slot=chart] svg, [data-slot=chart] canvas');
        expect(rendered).not.toBeNull();
      }, { timeout: 2000 });
    });
  },
};
