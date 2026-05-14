import type { Meta, StoryObj } from '@storybook/svelte';

import { expect } from 'storybook/test';
import { ChartContainer } from '@/components/ui/chart';
import ChartComCardStory from './ChartComCardStory.svelte';

const meta = {
  title: 'UI/Chart/Composições',
  component: ChartContainer,
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
  },
} satisfies Meta<typeof ChartContainer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ComCard: Story = {
  render: () => ({
    Component: ChartComCardStory,
    props: {},
  }),
  play: async ({ canvasElement, step }) => {
    await step('Card e ChartContainer renderizados', async () => {
      const chart = canvasElement.querySelector('[data-slot="chart"]');
      await expect(chart).toBeInTheDocument();
      const card = canvasElement.querySelector('[data-slot="card"]');
      await expect(card).toBeInTheDocument();
    });
  },
};
