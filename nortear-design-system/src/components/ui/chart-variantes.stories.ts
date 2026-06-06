import type { Meta, StoryObj } from '@storybook/html';
import { within, expect, waitFor } from 'storybook/test';
import { createChart } from './chart';

// ─── Shared data ──────────────────────────────────────────────────────────────

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

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta = {
  tags: ['display'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
  },
  title: 'UI/Chart/Variantes',
};

export default meta;
type Story = StoryObj;

// Helper: aguarda echarts terminar a init (deferida via MutationObserver).
async function expectChartRendered(canvasElement: HTMLElement): Promise<void> {
  await waitFor(() => {
    const renderedNode = canvasElement.querySelector('.nds-chart svg, .nds-chart canvas');
    expect(renderedNode).not.toBeNull();
  }, { timeout: 2000 });
}

// ─── Bar ──────────────────────────────────────────────────────────────────────

export const Bar: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.className = 'nds-w-full nds-max-w-md';
    wrap.appendChild(createChart({ data: chartData, type: 'bar', height: 200 }));
    return wrap;
  },
  parameters: {
    docs: {
      description: {
        story: 'Tipo bar — comparação entre categorias discretas. Use para dados não contínuos.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Chart renderizado', () => expectChartRendered(canvasElement));
  },
};

// ─── Linha ────────────────────────────────────────────────────────────────────

export const Linha: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.className = 'nds-w-full nds-max-w-md';
    wrap.appendChild(createChart({ data: chartData, type: 'line', height: 200 }));
    return wrap;
  },
  parameters: {
    docs: {
      description: {
        story: 'Tipo line — tendência contínua ao longo do tempo. Linha suave com pontos por dado.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Chart renderizado', () => expectChartRendered(canvasElement));
  },
};

// ─── Área ─────────────────────────────────────────────────────────────────────

export const Area: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.className = 'nds-w-full nds-max-w-md';
    wrap.appendChild(createChart({ data: chartData, type: 'area', height: 200 }));
    return wrap;
  },
  parameters: {
    docs: {
      description: {
        story: 'Tipo area — linha com região preenchida embaixo. Para enfatizar volume/magnitude ao longo do tempo.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Chart renderizado', () => expectChartRendered(canvasElement));
  },
};

// ─── Pie ──────────────────────────────────────────────────────────────────────

export const Pie: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.className = 'nds-w-full nds-max-w-md';
    wrap.appendChild(createChart({ data: pieData, type: 'pie', height: 240 }));
    return wrap;
  },
  parameters: {
    docs: {
      description: {
        story: 'Tipo pie (donut) — composição de um total dividido em categorias. Use para até ~6 segmentos.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Chart renderizado', () => expectChartRendered(canvasElement));
  },
};
