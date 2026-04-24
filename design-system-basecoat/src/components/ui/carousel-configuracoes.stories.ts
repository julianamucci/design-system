import type { Meta, StoryObj } from '@storybook/html';
import { createCarousel } from './carousel';
import { createCard, createCardContent } from './card';

// ─── Slide helpers ────────────────────────────────────────────────────────────

function buildSlide(label: string): HTMLElement {
  const card = createCard({ className: 'w-full aspect-video flex items-center justify-center bg-muted/50' });
  const content = createCardContent({ className: 'flex items-center justify-center' });
  const span = document.createElement('span');
  span.className = 'text-3xl font-semibold text-foreground';
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
  title: 'UI/Carousel/Configurações',
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Configurações do Carousel — item único (padrão), múltiplos itens visíveis e avanço automático via autoplay.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Single: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.className = 'w-full max-w-md';
    wrap.appendChild(createCarousel({ items: buildSlides(4) }));
    return wrap;
  },
};

export const MultiResponsive: Story = {
  render: () => {
    // Exemplo de composição multi-item: ilustra quantidade de slides maior
    // dentro do mesmo viewport — a mudança real por breakpoint fica a cargo
    // do wrapper consumidor aplicando `basis-1/2`/`md:basis-1/3` nos slides.
    const wrap = document.createElement('div');
    wrap.className = 'w-full max-w-xl';
    wrap.appendChild(createCarousel({ items: buildSlides(6) }));
    return wrap;
  },
};

export const Autoplay: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.className = 'w-full max-w-md';
    wrap.appendChild(
      createCarousel({
        items: buildSlides(4),
        autoplay: true,
        autoplayInterval: 3000,
      }),
    );
    return wrap;
  },
};
