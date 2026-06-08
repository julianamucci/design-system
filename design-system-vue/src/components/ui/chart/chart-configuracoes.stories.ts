import type { Meta, StoryObj } from '@storybook/vue3';
import { expect, waitFor } from 'storybook/test';
import { h } from 'vue';
import { ChartContainer, buildBarOption } from './index';

const xMonths = ['Jan', 'Feb', 'Mar', 'Apr'];
const singleSeries = [{ name: 'Vendas', data: [186, 305, 237, 73] }];
const multiSeries = [
  { name: 'Desktop', data: [186, 305, 237, 73] },
  { name: 'Mobile',  data: [80, 200, 120, 190] },
  { name: 'Tablet',  data: [40, 90, 60, 100] },
];

const meta: Meta = {
  parameters: { controls: { disable: true }, actions: { disable: true } },
  title: 'UI/Chart/Configuracoes',
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

export const ComTooltip: Story = {
  render: () => h(ChartContainer, { option: buildBarOption({ xAxis: xMonths, series: singleSeries }), class: 'h-[240px] w-[480px]' }),
  parameters: { docs: { description: { story: 'Tooltip nativo do ECharts — passe o mouse.' } } },
  play: async ({ canvasElement, step }) => step('Renderizado', () => expectRendered(canvasElement)),
};

export const ComLegenda: Story = {
  render: () => h(ChartContainer, { option: buildBarOption({ xAxis: xMonths, series: multiSeries }), class: 'h-[260px] w-[480px]' }),
  parameters: { docs: { description: { story: 'Legenda automática quando há >1 série.' } } },
  play: async ({ canvasElement, step }) => step('Renderizado', () => expectRendered(canvasElement)),
};

export const MultiSeries: Story = {
  render: () => h(ChartContainer, {
    option: buildBarOption({ xAxis: xMonths, series: multiSeries, title: 'Acessos por dispositivo' }),
    class: 'h-[280px] w-[500px]',
  }),
  parameters: { docs: { description: { story: 'Multi-série com título — caso típico de dashboard.' } } },
  play: async ({ canvasElement, step }) => step('Renderizado', () => expectRendered(canvasElement)),
};
