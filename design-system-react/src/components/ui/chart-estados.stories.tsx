import type { Meta, StoryObj } from '@storybook/react';
import { expect, waitFor } from 'storybook/test';
import { ChartContainer, buildBarOption } from './chart';

const xMonths = ['Jan', 'Feb', 'Mar', 'Apr'];
const singleSeries = [
  { name: 'Vendas', data: [186, 305, 237, 73] },
];
const multipleSeries = [
  { name: 'Vendas',       data: [186, 305, 237, 73] },
  { name: 'Devoluções',   data: [10, 25, 18, 7] },
  { name: 'Trocas',       data: [4, 12, 8, 3] },
];

const meta: Meta = {
  parameters: { controls: { disable: true }, actions: { disable: true } },
  title: 'UI/Chart/Estados',
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

export const Vazio: Story = {
  render: () => (
    <ChartContainer option={buildBarOption({ data: [] })} className="h-[200px] w-[480px]" />
  ),
  parameters: {
    docs: { description: { story: 'Estado vazio — ECharts mostra "No data" automaticamente quando series é vazia.' } },
  },
};

export const UmaSerie: Story = {
  render: () => (
    <ChartContainer
      option={buildBarOption({ xAxis: xMonths, series: singleSeries })}
      className="h-[240px] w-[480px]"
    />
  ),
  parameters: {
    docs: { description: { story: 'Uma única série — legenda fica oculta por default.' } },
  },
  play: async ({ canvasElement, step }) => {
    await step('Chart renderizado', () => expectChartRendered(canvasElement));
  },
};

export const MultiplasSeries: Story = {
  render: () => (
    <ChartContainer
      option={buildBarOption({ xAxis: xMonths, series: multipleSeries })}
      className="h-[280px] w-[500px]"
    />
  ),
  parameters: {
    docs: { description: { story: 'Múltiplas séries — legenda aparece automaticamente embaixo.' } },
  },
  play: async ({ canvasElement, step }) => {
    await step('Chart renderizado', () => expectChartRendered(canvasElement));
  },
};
