import type { Meta, StoryObj } from '@storybook/html';
import { within, expect } from 'storybook/test';
import { createChart } from './chart';

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta = {
  tags: ['display'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
  },
  title: 'UI/Chart/Estados',
};

export default meta;
type Story = StoryObj;

// ─── Vazio ────────────────────────────────────────────────────────────────────

export const Vazio: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.className = 'nds-w-full nds-max-w-md';
    wrap.appendChild(
      createChart({
        data: [],
        type: 'bar',
        height: 200,
      }),
    );
    return wrap;
  },
  parameters: {
    docs: {
      description: {
        story: 'Estado vazio — <code>data: []</code>. O componente exibe uma mensagem de estado vazio no lugar do SVG.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Container do gráfico está presente', async () => {
      const chart = canvasElement.querySelector('[data-slot="chart"]');
      await expect(chart).not.toBeNull();
    });

    await step('Mensagem de estado vazio está visível', async () => {
      const empty = canvasElement.querySelector('p');
      await expect(empty).not.toBeNull();
    });

    await step('Nenhum SVG renderizado no estado vazio', async () => {
      const svg = canvasElement.querySelector('svg');
      await expect(svg).toBeNull();
    });
  },
};

// ─── UmPonto ──────────────────────────────────────────────────────────────────

export const UmPonto: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.className = 'nds-w-full nds-max-w-md';
    wrap.appendChild(
      createChart({
        data: [{ label: 'Jan', value: 186 }],
        type: 'bar',
        height: 200,
      }),
    );
    return wrap;
  },
  parameters: {
    docs: {
      description: {
        story: 'Série com um único ponto de dado. O gráfico renderiza normalmente com uma única barra.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('SVG está presente com um único ponto', async () => {
      // echarts injeta o SVG de forma assíncrona após mount.
      await new Promise((r) => setTimeout(r, 100));
      const svg = canvasElement.querySelector('svg');
      await expect(svg).not.toBeNull();
    });

    await step('SVG do gráfico contém alguma marca renderizada', async () => {
      const svg = canvasElement.querySelector('svg');
      const paths = svg?.querySelectorAll('path, rect, circle') ?? [];
      await expect(paths.length).toBeGreaterThan(0);
    });
  },
};
