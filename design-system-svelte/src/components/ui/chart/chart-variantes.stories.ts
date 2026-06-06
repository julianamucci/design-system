import type { Meta, StoryObj } from '@storybook/svelte';
import { expect, waitFor } from 'storybook/test';
import {
  ChartContainer,
  buildBarOption, buildLineOption, buildAreaOption, buildPieOption,
} from './index';

const chartData = [
  { label: 'Jan', value: 186 }, { label: 'Feb', value: 305 },
  { label: 'Mar', value: 237 }, { label: 'Apr', value: 73 },
  { label: 'May', value: 209 }, { label: 'Jun', value: 214 },
];
const pieData = [
  { label: 'Desktop', value: 580 },
  { label: 'Mobile',  value: 420 },
  { label: 'Tablet',  value: 180 },
];

const meta = {
  parameters: { controls: { disable: true }, actions: { disable: true } },
  title: 'UI/Chart/Variantes',
  component: ChartContainer,
  tags: ['display'],
} satisfies Meta<typeof ChartContainer>;
export default meta;
type Story = StoryObj<typeof meta>;

async function expectRendered(el: HTMLElement) {
  await waitFor(() => {
    const n = el.querySelector('[data-slot=chart] svg, [data-slot=chart] canvas');
    expect(n).not.toBeNull();
  }, { timeout: 2000 });
}

export const Bar: Story = {
  args: { option: buildBarOption({ data: chartData }), class: 'h-[240px] w-[480px]' },
  parameters: { docs: { description: { story: 'Bar — categorias discretas.' } } },
  play: async ({ canvasElement, step }) => step('Renderizado', () => expectRendered(canvasElement)),
};

export const Linha: Story = {
  args: { option: buildLineOption({ data: chartData }), class: 'h-[240px] w-[480px]' },
  parameters: { docs: { description: { story: 'Line — tendência contínua.' } } },
  play: async ({ canvasElement, step }) => step('Renderizado', () => expectRendered(canvasElement)),
};

export const Area: Story = {
  args: { option: buildAreaOption({ data: chartData }), class: 'h-[240px] w-[480px]' },
  parameters: { docs: { description: { story: 'Area — linha com região preenchida.' } } },
  play: async ({ canvasElement, step }) => step('Renderizado', () => expectRendered(canvasElement)),
};

export const Pie: Story = {
  args: { option: buildPieOption({ data: pieData }), class: 'h-[280px] w-[480px]' },
  parameters: { docs: { description: { story: 'Pie (donut) — composição.' } } },
  play: async ({ canvasElement, step }) => step('Renderizado', () => expectRendered(canvasElement)),
};
