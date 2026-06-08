import type { Meta, StoryObj } from '@storybook/html';
import { within, expect } from 'storybook/test';
import { createChart } from './chart';
import { createCard, createCardHeader, createCardTitle, createCardDescription, createCardContent } from './card';

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
  title: 'UI/Chart/Composicoes',
};

export default meta;
type Story = StoryObj;

// ─── ComCard ──────────────────────────────────────────────────────────────────

export const ComCard: Story = {
  render: () => {
    const card = createCard({ className: 'nds-w-sm' });

    const header = createCardHeader();
    const title = createCardTitle({ text: 'Acessos mensais', level: 3 });
    const description = createCardDescription({ text: 'Janeiro — Junho 2024' });
    header.appendChild(title);
    header.appendChild(description);

    const content = createCardContent();
    content.appendChild(
      createChart({
        data: chartData,
        type: 'bar',
        height: 200,
      }),
    );

    card.appendChild(header);
    card.appendChild(content);

    return card;
  },
  parameters: {
    docs: {
      description: {
        story: 'Chart dentro de um Card — padrão recomendado para exibir gráficos com título, descrição e rodapé.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Card container está presente', async () => {
      const card = canvasElement.querySelector('[data-slot="card"]');
      await expect(card).not.toBeNull();
    });

    await step('Título do Card está visível', async () => {
      const title = canvasElement.querySelector('[data-slot="card-title"]');
      await expect(title).not.toBeNull();
      await expect(title?.textContent).toBe('Acessos mensais');
    });

    await step('Chart está dentro do Card', async () => {
      const chart = canvasElement.querySelector('[data-slot="card"] [data-slot="chart"]');
      await expect(chart).not.toBeNull();
    });

    await step('SVG do gráfico está presente', async () => {
      // echarts renderiza SVG sem role=img — buscamos por tag.
      await new Promise((r) => setTimeout(r, 100));
      const svg = canvasElement.querySelector('svg');
      await expect(svg).not.toBeNull();
    });
  },
};
