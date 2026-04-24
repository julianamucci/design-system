import type { Meta, StoryObj } from '@storybook/svelte';
import { ChartContainer } from '@/components/ui/chart';
import ChartStory from './ChartStory.svelte';

const meta = {
  title: 'UI/Chart/Configurações',
  component: ChartContainer,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof ChartContainer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ComTooltip: Story = {
  render: () => ({
    Component: ChartStory,
    props: {
      type: 'bar',
      ariaLabel: 'Gráfico de barras com tooltip: acessos mensais',
      class: 'h-[220px] w-[340px]',
    },
  }),
};

export const MultiSeries: Story = {
  render: () => ({
    Component: ChartStory,
    props: {
      type: 'bar',
      multiSeries: true,
      ariaLabel: 'Gráfico multi-séries: Desktop e Mobile por mês',
      class: 'h-[220px] w-[360px]',
    },
  }),
};
