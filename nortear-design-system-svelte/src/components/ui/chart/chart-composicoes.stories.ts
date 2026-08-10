import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { expect, waitFor } from 'storybook/test';
import { ChartContainer, buildBarOption } from './index';

const chartData = [
  { label: 'Jan', value: 186 }, { label: 'Feb', value: 305 },
  { label: 'Mar', value: 237 }, { label: 'Apr', value: 73 },
];

const meta: Meta = {
  parameters: { controls: { disable: true }, actions: { disable: true } },
  title: 'UI/Chart/Compositions',
  component: ChartContainer,
  tags: ['display'],
};
export default meta;
type Story = StoryObj;

async function expectRendered(el: HTMLElement) {
  await waitFor(() => {
    const n = el.querySelector('[data-slot=chart] svg, [data-slot=chart] canvas');
    expect(n).not.toBeNull();
  }, { timeout: 2000 });
}

export const IsolatedChart: Story = {
  args: { option: buildBarOption({ data: chartData }), class: 'h-[240px] w-[480px]' },
  parameters: { docs: { description: { story: 'Chart sem wrapper — use diretamente em layouts simples.' } } },
  play: async ({ canvasElement, step }) => step('Renderizado', () => expectRendered(canvasElement)),
};

export const InlineTitle: Story = {
  args: {
    option: buildBarOption({ data: chartData, title: 'Vendas mensais' }),
    class: 'h-[280px] w-[480px]',
  },
  parameters: { docs: { description: { story: 'Título no option — útil quando o chart é stand-alone.' } } },
  play: async ({ canvasElement, step }) => step('Renderizado', () => expectRendered(canvasElement)),
};
