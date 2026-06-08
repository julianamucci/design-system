import type { Meta, StoryObj } from '@storybook/svelte';
import { expect, waitFor } from 'storybook/test';
import { ChartContainer, buildBarOption } from './index';

const xMonths = ['Jan', 'Feb', 'Mar', 'Apr'];
const singleSeries = [{ name: 'Vendas', data: [186, 305, 237, 73] }];
const multiSeries = [
  { name: 'Desktop', data: [186, 305, 237, 73] },
  { name: 'Mobile',  data: [80, 200, 120, 190] },
  { name: 'Tablet',  data: [40, 90, 60, 100] },
];

const meta = {
  parameters: { controls: { disable: true }, actions: { disable: true } },
  title: 'UI/Chart/Configuracoes',
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

export const ComTooltip: Story = {
  args: { option: buildBarOption({ xAxis: xMonths, series: singleSeries }), class: 'h-[240px] w-[480px]' },
  parameters: { docs: { description: { story: 'Tooltip nativo do ECharts — passe o mouse.' } } },
  play: async ({ canvasElement, step }) => step('Renderizado', () => expectRendered(canvasElement)),
};

export const ComLegenda: Story = {
  args: { option: buildBarOption({ xAxis: xMonths, series: multiSeries }), class: 'h-[260px] w-[480px]' },
  parameters: { docs: { description: { story: 'Legenda automática quando há >1 série.' } } },
  play: async ({ canvasElement, step }) => step('Renderizado', () => expectRendered(canvasElement)),
};

export const MultiSeries: Story = {
  args: {
    option: buildBarOption({ xAxis: xMonths, series: multiSeries, title: 'Acessos por dispositivo' }),
    class: 'h-[280px] w-[500px]',
  },
  parameters: { docs: { description: { story: 'Multi-série com título — dashboard típico.' } } },
  play: async ({ canvasElement, step }) => step('Renderizado', () => expectRendered(canvasElement)),
};
