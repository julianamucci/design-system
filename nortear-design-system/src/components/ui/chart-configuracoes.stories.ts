import type { Meta, StoryObj } from '@storybook/html';
import { createChart } from './chart';
import { within, expect } from 'storybook/test';

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
  tags: ['display'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
  },
  title: 'UI/Chart/Configuracoes',
};

export default meta;
type Story = StoryObj;

// ─── CoresPersonalizadas ──────────────────────────────────────────────────────

export const CoresPersonalizadas: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.className = 'nds-w-full nds-max-w-md';
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
        story: 'Cores personalizadas via prop <code>colors</code>. Útil para alinhar ao branding de produto sem alterar os tokens globais.',
      },
    },
  },

  play: async ({ canvasElement }) => {
    const el = canvasElement as HTMLElement;
    await expect(within(el).queryAllByRole('button').length).toBeGreaterThanOrEqual(0);
  },
};

// ─── AlturaPersonalizada ──────────────────────────────────────────────────────

export const AlturaPersonalizada: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.className = 'nds-w-full nds-max-w-md';
    wrap.appendChild(
      createChart({
        data: chartData,
        type: 'bar',
        height: 300,
      }),
    );
    return wrap;
  },
  parameters: {
    docs: {
      description: {
        story: 'Altura de 300px via prop <code>height</code>. O padrão é 200px.',
      },
    },
  },

  play: async ({ canvasElement }) => {
    const el = canvasElement as HTMLElement;
    await expect(within(el).queryAllByRole('button').length).toBeGreaterThanOrEqual(0);
  },
};
