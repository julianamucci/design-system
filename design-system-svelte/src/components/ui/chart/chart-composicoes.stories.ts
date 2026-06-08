import type { Meta, StoryObj } from '@storybook/svelte';
import { expect, waitFor } from 'storybook/test';
import { ChartContainer, buildBarOption } from './index';

const chartData = [
  { label: 'Jan', value: 186 }, { label: 'Feb', value: 305 },
  { label: 'Mar', value: 237 }, { label: 'Apr', value: 73 },
];

const meta = {
  parameters: { controls: { disable: true }, actions: { disable: true } },
  title: 'UI/Chart/Composicoes',
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

export const ChartIsolado: Story = {
  args: { option: buildBarOption({ data: chartData }), class: 'h-[240px] w-[480px]' },
  parameters: { docs: { description: { story: 'Chart sem wrapper — use diretamente em layouts simples.' } } },
  play: async ({ canvasElement, step }) => step('Renderizado', () => expectRendered(canvasElement)),
};

export const TituloEmbutido: Story = {
  args: {
    option: buildBarOption({ data: chartData, title: 'Vendas mensais' }),
    class: 'h-[280px] w-[480px]',
  },
  parameters: { docs: { description: { story: 'Título no option — útil quando o chart é stand-alone.' } } },
  play: async ({ canvasElement, step }) => step('Renderizado', () => expectRendered(canvasElement)),
};
