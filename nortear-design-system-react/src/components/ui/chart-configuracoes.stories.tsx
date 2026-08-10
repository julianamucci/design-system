import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { ChartContainer, buildBarOption } from './chart';

const singleSeries = [
  { label: 'Jan', value: 186 },
  { label: 'Feb', value: 305 },
  { label: 'Mar', value: 237 },
  { label: 'Apr', value: 73 },
];

const xMonths = ['Jan', 'Feb', 'Mar', 'Apr'];
const multiSeries = [
  { name: 'Desktop', data: [186, 305, 237, 73] },
  { name: 'Mobile',  data: [80, 200, 120, 190] },
  { name: 'Tablet',  data: [40, 90, 60, 100] },
];

const meta: Meta = {
  parameters: { controls: { disable: true }, actions: { disable: true } },
  title: 'UI/Chart/Settings',
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

export const WithTooltip: Story = {
  render: () => (
    <ChartContainer option={buildBarOption({ data: singleSeries })} className="" style={{ height: "240px", width: "480px" }} />
  ),
  parameters: {
    docs: { description: { story: 'Tooltip nativo do ECharts — passe o mouse sobre uma barra.' } },
  },
  play: async ({ canvasElement, step }) => {
    await step('Chart renderizado', () => expectChartRendered(canvasElement));
  },
};

export const WithCaption: Story = {
  render: () => (
    <ChartContainer
      option={buildBarOption({ xAxis: xMonths, series: multiSeries })}
      className="" style={{ height: "260px", width: "480px" }}
    />
  ),
  parameters: {
    docs: { description: { story: 'Legenda aparece automaticamente quando há >1 série. Clique pra toggle séries.' } },
  },
  play: async ({ canvasElement, step }) => {
    await step('Chart renderizado', () => expectChartRendered(canvasElement));
  },
};

export const MultiSeries: Story = {
  render: () => (
    <ChartContainer
      option={buildBarOption({ xAxis: xMonths, series: multiSeries, title: 'Acessos por dispositivo' })}
      className="" style={{ height: "280px", width: "500px" }}
    />
  ),
  parameters: {
    docs: { description: { story: 'Multi-série com título — caso típico de dashboard analítico.' } },
  },
  play: async ({ canvasElement, step }) => {
    await step('Chart renderizado', () => expectChartRendered(canvasElement));
  },
};
