import type { Meta, StoryObj } from '@storybook/html';
import { userEvent, within, expect } from 'storybook/test';
import { createCarousel } from './carousel';
import { createCard, createCardContent, createCardHeader, createCardTitle, createCardDescription } from './card';

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
  title: 'UI/Carousel/Composições',
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      description: {
        component: 'Composições do Carousel — com dots customizados abaixo do viewport e galeria de imagens.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const ComDots: Story = {
  render: () => {
    const total = 5;
    const wrap = document.createElement('div');
    wrap.className = 'w-full max-w-md space-y-3';

    // Container dos dots (alimentado via onIndexChange)
    const dotsRow = document.createElement('div');
    dotsRow.className = 'flex items-center justify-center gap-2';
    dotsRow.setAttribute('aria-label', 'Ir para o slide');

    const dots: HTMLButtonElement[] = [];
    for (let i = 0; i < total; i++) {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.setAttribute('aria-label', `Ir para o slide ${i + 1} de ${total}`);
      dot.className = 'h-2 w-2 rounded-full bg-muted-foreground/30 transition-colors';
      dots.push(dot);
      dotsRow.appendChild(dot);
    }

    const carousel = createCarousel({
      items: buildSlides(total),
      onIndexChange: (index) => {
        dots.forEach((d, i) => {
          const active = i === index;
          d.classList.toggle('bg-primary', active);
          d.classList.toggle('bg-muted-foreground/30', !active);
          d.setAttribute('aria-current', active ? 'true' : 'false');
        });
      },
    });

    // Estado inicial
    dots[0].classList.remove('bg-muted-foreground/30');
    dots[0].classList.add('bg-primary');
    dots[0].setAttribute('aria-current', 'true');

    wrap.append(carousel, dotsRow);
    return wrap;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Dots de navegação renderizados', async () => {
      const dotButtons = canvas.getAllByRole('button', { name: /ir para o slide/i });
      await expect(dotButtons.length).toBe(5);
    });

    await step('Avançar um slide atualiza dot ativo', async () => {
      const next = canvas.getByRole('button', { name: /next slide/i });
      await userEvent.click(next);
      const secondDot = canvas.getByRole('button', { name: /ir para o slide 2 de 5/i });
      await expect(secondDot).toHaveAttribute('aria-current', 'true');
    });
  },
};

export const Galeria: Story = {
  render: () => {
    const wrap = document.createElement('div');
    wrap.className = 'w-full max-w-md';

    const photos = [
      { title: 'Foto 1', description: 'Paisagem natural ao amanhecer' },
      { title: 'Foto 2', description: 'Detalhe arquitetônico em pedra' },
      { title: 'Foto 3', description: 'Cidade iluminada à noite' },
      { title: 'Foto 4', description: 'Praia vista do alto' },
    ];

    const items = photos.map((photo) => {
      const card = createCard({ className: 'w-full overflow-hidden' });
      const cover = document.createElement('div');
      cover.className = 'w-full aspect-video bg-gradient-to-br from-primary/20 to-muted flex items-center justify-center';
      const label = document.createElement('span');
      label.className = 'text-2xl font-semibold text-foreground';
      label.textContent = photo.title;
      cover.appendChild(label);

      const header = createCardHeader();
      header.appendChild(createCardTitle({ text: photo.title, level: 3 }));
      header.appendChild(createCardDescription({ text: photo.description }));

      card.append(cover, header);
      return card;
    });

    wrap.appendChild(createCarousel({ items }));
    return wrap;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Galeria renderizada com slides', async () => {
      await expect(canvas.getByText('Foto 1')).toBeVisible();
      await expect(canvas.getByRole('button', { name: /next slide/i })).toBeVisible();
    });
  },
};
