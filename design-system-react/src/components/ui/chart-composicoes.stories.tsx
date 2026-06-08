import type { Meta, StoryObj } from '@storybook/react';
import { expect, waitFor } from 'storybook/test';
import { ChartContainer, buildBarOption } from './chart';

const chartData = [
  { label: 'Jan', value: 186 },
  { label: 'Feb', value: 305 },
  { label: 'Mar', value: 237 },
  { label: 'Apr', value: 73 },
];

const meta: Meta = {
  parameters: { controls: { disable: true }, actions: { disable: true } },
  title: 'UI/Chart/Composicoes',
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

export const ComCard: Story = {
  render: () => (
    <div className="rounded-lg border border-border bg-card p-6 shadow-sm w-[480px]">
      <h3 className="text-sm font-medium mb-1">Acessos por mês</h3>
      <p className="text-xs text-muted-foreground mb-4">Janeiro — Abril</p>
      <ChartContainer option={buildBarOption({ data: chartData })} className="h-[200px] w-full" />
    </div>
  ),
  parameters: {
    docs: { description: { story: 'Chart dentro de um Card com header semântico — composição padrão para dashboards.' } },
  },
  play: async ({ canvasElement, step }) => {
    await step('Chart renderizado dentro do card', () => expectChartRendered(canvasElement));
  },
};

export const TituloEmbutido: Story = {
  render: () => (
    <ChartContainer
      option={buildBarOption({ data: chartData, title: 'Vendas mensais' })}
      className="h-[260px] w-[480px]"
    />
  ),
  parameters: {
    docs: { description: { story: 'Título no próprio option — útil quando o chart é stand-alone sem wrapper de card.' } },
  },
  play: async ({ canvasElement, step }) => {
    await step('Chart renderizado com título', () => expectChartRendered(canvasElement));
  },
};
