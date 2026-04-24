import type { Meta, StoryObj } from '@storybook/svelte';
import { within, expect } from 'storybook/test';
import { ChartContainer } from '@/components/ui/chart';
import ChartStory from './ChartStory.svelte';

const meta = {
  title: 'UI/Chart/Estados',
  component: ChartContainer,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof ChartContainer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Vazio: Story = {
  render: () => ({
    Component: ChartStory,
    props: {
      type: 'bar',
      ariaLabel: 'Gráfico de barras: sem dados disponíveis',
      class: 'h-[220px] w-[340px]',
      data: [],
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('ChartContainer renderizado mesmo sem dados', async () => {
      const chart = canvasElement.querySelector('[data-slot="chart"]');
      await expect(chart).toBeInTheDocument();
    });
  },
};

export const UmaSerie: Story = {
  render: () => ({
    Component: ChartStory,
    props: {
      type: 'bar',
      ariaLabel: 'Gráfico de barras: série única de acessos',
      class: 'h-[220px] w-[340px]',
      multiSeries: false,
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('ChartContainer com data-slot="chart" presente', async () => {
      const chart = canvasElement.querySelector('[data-slot="chart"]');
      await expect(chart).toBeInTheDocument();
    });

    await step('SVG renderizado', async () => {
      const svg = canvasElement.querySelector('[data-slot="chart"] svg');
      await expect(svg).toBeInTheDocument();
    });
  },
};
