import type { Meta, StoryObj } from '@storybook/react';
import { expect, waitFor } from 'storybook/test';
import {
  ChartContainer,
  buildBarOption,
  buildLineOption,
  buildAreaOption,
  buildPieOption,
} from './chart';

const chartData = [
  { label: 'Jan', value: 186 },
  { label: 'Feb', value: 305 },
  { label: 'Mar', value: 237 },
  { label: 'Apr', value: 73 },
  { label: 'May', value: 209 },
  { label: 'Jun', value: 214 },
];

const pieData = [
  { label: 'Desktop', value: 580 },
  { label: 'Mobile',  value: 420 },
  { label: 'Tablet',  value: 180 },
];

const meta: Meta = {
  parameters: { controls: { disable: true }, actions: { disable: true } },
  title: 'UI/Chart/Variantes',
  tags: ["display"],
};
export default meta;
type Story = StoryObj;

async function expectChartRendered(canvasElement: HTMLElement) {
  await waitFor(() => {
    const node = canvasElement.querySelector('[data-slot=chart] svg, [data-slot=chart] canvas');
    expect(node).not.toBeNull();
  }, { timeout: 2000 });
}

export const Bar: Story = {
  render: () => (
    <ChartContainer option={buildBarOption({ data: chartData })} className="h-[240px] w-[480px]" />
  ),
  parameters: {
    docs: { description: { story: 'Tipo bar — comparação entre categorias discretas.' } },
  },
  play: async ({ canvasElement, step }) => {
    await step('Chart renderizado', () => expectChartRendered(canvasElement));
  },
};

export const Linha: Story = {
  render: () => (
    <ChartContainer option={buildLineOption({ data: chartData })} className="h-[240px] w-[480px]" />
  ),
  parameters: {
    docs: { description: { story: 'Tipo line — tendência contínua com pontos por dado.' } },
  },
  play: async ({ canvasElement, step }) => {
    await step('Chart renderizado', () => expectChartRendered(canvasElement));
  },
};

export const Area: Story = {
  render: () => (
    <ChartContainer option={buildAreaOption({ data: chartData })} className="h-[240px] w-[480px]" />
  ),
  parameters: {
    docs: { description: { story: 'Tipo area — linha com região preenchida embaixo.' } },
  },
  play: async ({ canvasElement, step }) => {
    await step('Chart renderizado', () => expectChartRendered(canvasElement));
  },
};

export const Pie: Story = {
  render: () => (
    <ChartContainer option={buildPieOption({ data: pieData })} className="h-[280px] w-[480px]" />
  ),
  parameters: {
    docs: { description: { story: 'Tipo pie (donut) — composição de um total dividido em categorias.' } },
  },
  play: async ({ canvasElement, step }) => {
    await step('Chart renderizado', () => expectChartRendered(canvasElement));
  },
};
