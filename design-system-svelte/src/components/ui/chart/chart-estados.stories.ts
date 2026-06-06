import type { Meta, StoryObj } from '@storybook/svelte';
import { expect, waitFor } from 'storybook/test';
import { ChartContainer, buildBarOption } from './index';

const xMonths = ['Jan', 'Feb', 'Mar', 'Apr'];
const singleSeries = [{ name: 'Vendas', data: [186, 305, 237, 73] }];
const multipleSeries = [
  { name: 'Vendas',     data: [186, 305, 237, 73] },
  { name: 'Devoluções', data: [10, 25, 18, 7] },
  { name: 'Trocas',     data: [4, 12, 8, 3] },
];

const meta = {
  parameters: { controls: { disable: true }, actions: { disable: true } },
  title: 'UI/Chart/Estados',
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

export const Vazio: Story = {
  args: { option: buildBarOption({ data: [] }), class: 'h-[200px] w-[480px]' },
  parameters: { docs: { description: { story: '"No data" automático do ECharts quando series vazia.' } } },
};

export const UmaSerie: Story = {
  args: { option: buildBarOption({ xAxis: xMonths, series: singleSeries }), class: 'h-[240px] w-[480px]' },
  parameters: { docs: { description: { story: 'Uma série — legenda oculta por default.' } } },
  play: async ({ canvasElement, step }) => step('Renderizado', () => expectRendered(canvasElement)),
};

export const MultiplasSeries: Story = {
  args: { option: buildBarOption({ xAxis: xMonths, series: multipleSeries }), class: 'h-[280px] w-[500px]' },
  parameters: { docs: { description: { story: 'Múltiplas séries — legenda automática.' } } },
  play: async ({ canvasElement, step }) => step('Renderizado', () => expectRendered(canvasElement)),
};
