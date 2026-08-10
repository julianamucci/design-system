import type { Meta, StoryObj } from '@storybook/react-vite';
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
  title: 'UI/Chart/Compositions',
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

export const WithCard: Story = {
  render: () => (
    <div className="nds-rounded-lg nds-border-default nds-bg-card nds-p-6 nds-shadow-sm" style={{ width: "480px" }}>
      <h3 className="nds-text-body nds-font-medium nds-mb-1">Acessos por mês</h3>
      <p className="nds-text-caption nds-text-muted-foreground nds-mb-4">Janeiro — Abril</p>
      <ChartContainer option={buildBarOption({ data: chartData })} className="nds-w-full" style={{ height: "200px" }} />
    </div>
  ),
  parameters: {
    docs: { description: { story: 'Chart dentro de um Card com header semântico — composição padrão para dashboards.' } },
  },
  play: async ({ canvasElement, step }) => {
    await step('Chart renderizado dentro do card', () => expectChartRendered(canvasElement));
  },
};

export const InlineTitle: Story = {
  render: () => (
    <ChartContainer
      option={buildBarOption({ data: chartData, title: 'Vendas mensais' })}
      className="" style={{ height: "260px", width: "480px" }}
    />
  ),
  parameters: {
    docs: { description: { story: 'Título no próprio option — útil quando o chart é stand-alone sem wrapper de card.' } },
  },
  play: async ({ canvasElement, step }) => {
    await step('Chart renderizado com título', () => expectChartRendered(canvasElement));
  },
};
