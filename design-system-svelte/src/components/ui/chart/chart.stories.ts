import type { Meta, StoryObj } from '@storybook/svelte';

import { within, expect } from 'storybook/test';
import { ChartContainer } from '@/components/ui/chart';
import ChartStory from './ChartStory.svelte';
import ChartDocs from '@/components/docs/ChartDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const meta = {
  title: 'UI/Chart',
  component: ChartContainer,
  tags: ['autodocs'],
  parameters: {
    docs: { page: withAutoDocsTab(ChartDocs) },
    layout: 'centered',
  },
  argTypes: {
    type: {
      control: 'select',
      options: ['bar', 'line'],
      description: 'Tipo de gráfico renderizado dentro do ChartContainer',
    },
    multiSeries: {
      control: 'boolean',
      description: 'Exibe múltiplas séries de dados',
    },
  },
  args: {
    type: 'bar',
    multiSeries: false,
  },
} satisfies Meta<typeof ChartContainer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => ({
    Component: ChartStory,
    props: {
      type: (args as any).type ?? 'bar',
      multiSeries: (args as any).multiSeries ?? false,
      ariaLabel: 'Gráfico de acessos mensais',
      class: 'h-[220px] w-[340px]',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('ChartContainer renderiza com data-slot="chart"', async () => {
      const chart = canvasElement.querySelector('[data-slot="chart"]');
      await expect(chart).toBeInTheDocument();
    });

    await step('SVG está presente dentro do container', async () => {
      const svg = canvasElement.querySelector('[data-slot="chart"] svg');
      await expect(svg).toBeInTheDocument();
    });
  },
};
