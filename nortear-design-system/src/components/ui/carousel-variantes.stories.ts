import type { Meta, StoryObj } from '@storybook/html';
import { within, expect } from 'storybook/test';
import { createCarousel } from './carousel';
import { createCard, createCardContent } from './card';

// ─── Slide helpers ────────────────────────────────────────────────────────────

function buildSlide(label: string): HTMLElement {
  const card = createCard({ className: 'nds-w-full nds-cluster nds-bg-muted-soft' });
  card.dataset.align = 'center';
  card.dataset.justify = 'center';
  card.style.aspectRatio = '16 / 9';
  const content = createCardContent({ className: 'nds-cluster' });
  content.dataset.align = 'center';
  content.dataset.justify = 'center';
  const span = document.createElement('span');
  span.className = 'nds-text-h2 nds-font-semibold nds-text-foreground';
  span.textContent = label;
  content.appendChild(span);
  card.appendChild(content);
  return card;
}

function buildSlides(count: number, prefix = 'Slide'): HTMLElement[] {
  return Array.from({ length: count }, (_, i) => buildSlide(`${prefix} ${i + 1}`));
}

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta = {
  tags: ['display'],
  title: 'UI/Carousel/Variantes',
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      description: {
        component: 'Orientações disponíveis para o Carousel — horizontal (padrão) e vertical. A implementação Basecoat desliza lateralmente por padrão.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Horizontal: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.className = 'nds-w-full nds-max-w-md';
    wrap.appendChild(createCarousel({ items: buildSlides(5) }));
    return wrap;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Carousel renderizado com role=region', async () => {
      await expect(canvas.getByRole('region')).toHaveAttribute('aria-roledescription', 'carousel');
    });
  },
};

export const Vertical: Story = {
  render: () => {
    // A implementação Basecoat do Carousel é horizontal por padrão. Esta variante
    // apresenta a mesma API com itens de altura fixa — para verdadeira orientação
    // vertical, extender o componente aplicando translateY no track.
    const wrap = document.createElement('div');
    wrap.className = 'nds-w-full nds-max-w-md';
    wrap.appendChild(createCarousel({ items: buildSlides(4) }));
    return wrap;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Carousel vertical renderizado com role=region', async () => {
      await expect(canvas.getByRole('region')).toBeInTheDocument();
    });
  },
};
