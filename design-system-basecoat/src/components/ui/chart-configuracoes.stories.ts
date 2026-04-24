import type { Meta, StoryObj } from '@storybook/html';
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
  title: 'UI/Chart/Configurações',
};

export default meta;
type Story = StoryObj;

// ─── CoresPersonalizadas ──────────────────────────────────────────────────────

export const CoresPersonalizadas: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.className = 'w-full max-w-md';
    wrap.appendChild(
      createChart({
        data: chartData,
        type: 'bar',
        height: 200,
        colors: ['#6366f1', '#8b5cf6', '#a855f7', '#c084fc', '#d946ef', '#e879f9'],
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
};

// ─── AlturaPersonalizada ──────────────────────────────────────────────────────

export const AlturaPersonalizada: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.className = 'w-full max-w-md';
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
};
