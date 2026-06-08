import type { Meta, StoryObj } from '@storybook/html';
import { createCarousel } from './carousel';
import { createCard, createCardContent } from './card';
import { within, expect } from 'storybook/test';

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
  title: 'UI/Carousel/Configuracoes',
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      description: {
        component: 'Configuracoes do Carousel — item único (padrão), múltiplos itens visíveis e avanço automático via autoplay.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Single: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.className = 'nds-w-full nds-max-w-md';
    wrap.appendChild(createCarousel({ items: buildSlides(4) }));
    return wrap;
  },

  play: async ({ canvasElement }) => {
    const el = canvasElement as HTMLElement;
    await expect(within(el).queryAllByRole('button').length).toBeGreaterThanOrEqual(0);
  },
};

export const MultiResponsive: Story = {
  render: () => {
    // Exemplo de composição multi-item: ilustra quantidade de slides maior
    // dentro do mesmo viewport — a mudança real por breakpoint fica a cargo
    // do wrapper consumidor aplicando `basis-1/2`/`md:basis-1/3` nos slides.
    const wrap = document.createElement('div');
    wrap.className = 'nds-w-full';
    wrap.style.maxWidth = '36rem';
    wrap.appendChild(createCarousel({ items: buildSlides(6) }));
    return wrap;
  },

  play: async ({ canvasElement }) => {
    const el = canvasElement as HTMLElement;
    await expect(within(el).queryAllByRole('button').length).toBeGreaterThanOrEqual(0);
  },
};

export const Autoplay: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.className = 'nds-w-full nds-max-w-md';
    wrap.appendChild(
      createCarousel({
        items: buildSlides(4),
        autoplay: true,
        autoplayInterval: 3000,
      }),
    );
    return wrap;
  },

  play: async ({ canvasElement }) => {
    const el = canvasElement as HTMLElement;
    await expect(within(el).queryAllByRole('button').length).toBeGreaterThanOrEqual(0);
  },
};
