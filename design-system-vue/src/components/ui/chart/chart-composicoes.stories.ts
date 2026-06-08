import type { Meta, StoryObj } from '@storybook/vue3';
import { expect, waitFor } from 'storybook/test';
import { h } from 'vue';
import { ChartContainer, buildBarOption } from './index';

const chartData = [
  { label: 'Jan', value: 186 }, { label: 'Feb', value: 305 },
  { label: 'Mar', value: 237 }, { label: 'Apr', value: 73 },
];

const meta: Meta = {
  parameters: { controls: { disable: true }, actions: { disable: true } },
  title: 'UI/Chart/Composicoes',
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

export const ComCard: Story = {
  render: () => h('div', { class: 'rounded-lg border border-border bg-card p-6 shadow-sm w-[480px]' }, [
    h('h3', { class: 'text-sm font-medium mb-1' }, 'Acessos por mês'),
    h('p', { class: 'text-xs text-muted-foreground mb-4' }, 'Janeiro — Abril'),
    h(ChartContainer, { option: buildBarOption({ data: chartData }), class: 'h-[200px] w-full' }),
  ]),
  parameters: { docs: { description: { story: 'Chart dentro de Card — composição padrão para dashboards.' } } },
  play: async ({ canvasElement, step }) => step('Renderizado', () => expectRendered(canvasElement)),
};

export const TituloEmbutido: Story = {
  render: () => h(ChartContainer, {
    option: buildBarOption({ data: chartData, title: 'Vendas mensais' }),
    class: 'h-[260px] w-[480px]',
  }),
  parameters: { docs: { description: { story: 'Título no option — útil sem wrapper de card.' } } },
  play: async ({ canvasElement, step }) => step('Renderizado', () => expectRendered(canvasElement)),
};
