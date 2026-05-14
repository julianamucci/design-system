import type { Meta, StoryObj } from '@storybook/svelte';

import { expect } from 'storybook/test';
import { ChartContainer } from '@/components/ui/chart';
import ChartStory from './ChartStory.svelte';

const meta = {
  title: 'UI/Chart/Variantes',
  component: ChartContainer,
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
  },
} satisfies Meta<typeof ChartContainer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Bar: Story = {
  render: () => ({
    Component: ChartStory,
    props: {
      type: 'bar',
      ariaLabel: 'Gráfico de barras: acessos mensais',
      class: 'h-[220px] w-[340px]',
    },
  }),
  play: async ({ canvasElement, step }) => {
    await step('ChartContainer renderizado', async () => {
      const chart = canvasElement.querySelector('[data-slot="chart"]');
      await expect(chart).toBeInTheDocument();
    });
  },
};

export const Linha: Story = {
  render: () => ({
    Component: ChartStory,
    props: {
      type: 'line',
      ariaLabel: 'Gráfico de linhas: acessos mensais',
      class: 'h-[220px] w-[340px]',
    },
  }),
  play: async ({ canvasElement, step }) => {
    await step('ChartContainer renderizado', async () => {
      const chart = canvasElement.querySelector('[data-slot="chart"]');
      await expect(chart).toBeInTheDocument();
    });
  },
};
