import type { Meta, StoryObj } from '@storybook/html';
import { within, expect } from 'storybook/test';
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

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta = {
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
  },
  title: 'UI/Chart/Variantes',
};

export default meta;
type Story = StoryObj;

// ─── Bar ──────────────────────────────────────────────────────────────────────

export const Bar: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.className = 'w-full max-w-md';
    wrap.appendChild(
      createChart({
        data: chartData,
        type: 'bar',
        height: 200,
      }),
    );
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
    await step('SVG de bar chart está presente', async () => {
      const svg = canvasElement.querySelector('svg[role="img"]');
      await expect(svg).not.toBeNull();
    });

    await step('Barras (rect) renderizadas para cada ponto de dado', async () => {
      const rects = canvasElement.querySelectorAll('rect[role="graphics-symbol"]');
      await expect(rects.length).toBe(chartData.length);
    });
  },
};

// ─── Linha ────────────────────────────────────────────────────────────────────

export const Linha: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.className = 'w-full max-w-md';
    wrap.appendChild(
      createChart({
        data: chartData,
        type: 'line',
        height: 200,
      }),
    );
    return wrap;
  },
  parameters: {
    docs: {
      description: {
        story: 'Tipo line — tendência contínua ao longo do tempo. Inclui área preenchida e pontos de dados.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('SVG de line chart está presente', async () => {
      const svg = canvasElement.querySelector('svg[role="img"]');
      await expect(svg).not.toBeNull();
    });

    await step('Pontos (circle) renderizados para cada ponto de dado', async () => {
      const circles = canvasElement.querySelectorAll('circle[role="graphics-symbol"]');
      await expect(circles.length).toBe(chartData.length);
    });

    await step('Path da linha está presente', async () => {
      const path = canvasElement.querySelector('path[stroke]');
      await expect(path).not.toBeNull();
    });
  },
};
