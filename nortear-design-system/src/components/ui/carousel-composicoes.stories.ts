import type { Meta, StoryObj } from '@storybook/html';
import { userEvent, within, expect } from 'storybook/test';
import { createCarousel } from './carousel';
import { createCard, createCardContent, createCardHeader, createCardTitle, createCardDescription } from './card';

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
  title: 'UI/Carousel/Composicoes',
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      description: {
        component: 'Composicoes do Carousel — com dots customizados abaixo do viewport e galeria de imagens.',
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
    wrap.className = 'nds-stack nds-w-full nds-max-w-md';
    wrap.dataset.spacing = 'sm';

    // Container dos dots (alimentado via onIndexChange)
    const dotsRow = document.createElement('div');
    dotsRow.className = 'nds-cluster';
    dotsRow.dataset.align = 'center';
    dotsRow.dataset.justify = 'center';
    dotsRow.dataset.spacing = 'sm';
    dotsRow.setAttribute('aria-label', 'Ir para o slide');

    const dots: HTMLButtonElement[] = [];
    for (let i = 0; i < total; i++) {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.setAttribute('aria-label', `Ir para o slide ${i + 1} de ${total}`);
      dot.className = 'nds-rounded-full';
      dot.style.height = '0.5rem';
      dot.style.width = '0.5rem';
      dot.style.background = 'color-mix(in srgb, var(--muted-foreground) 30%, transparent)';
      dot.style.transition = 'background-color 150ms';
      dot.style.border = '0';
      dot.style.padding = '0';
      dots.push(dot);
      dotsRow.appendChild(dot);
    }

    const carousel = createCarousel({
      items: buildSlides(total),
      onIndexChange: (index) => {
        dots.forEach((d, i) => {
          const active = i === index;
          d.style.background = active
            ? 'var(--primary)'
            : 'color-mix(in srgb, var(--muted-foreground) 30%, transparent)';
          d.setAttribute('aria-current', active ? 'true' : 'false');
        });
      },
    });

    // Estado inicial
    dots[0].style.background = 'var(--primary)';
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
    wrap.className = 'nds-w-full nds-max-w-md';

    const photos = [
      { title: 'Foto 1', description: 'Paisagem natural ao amanhecer' },
      { title: 'Foto 2', description: 'Detalhe arquitetônico em pedra' },
      { title: 'Foto 3', description: 'Cidade iluminada à noite' },
      { title: 'Foto 4', description: 'Praia vista do alto' },
    ];

    const items = photos.map((photo) => {
      const card = createCard({ className: 'nds-w-full nds-overflow-hidden' });
      const cover = document.createElement('div');
      cover.className = 'nds-w-full nds-cluster';
      cover.dataset.align = 'center';
      cover.dataset.justify = 'center';
      cover.style.aspectRatio = '16 / 9';
      cover.style.background = 'linear-gradient(to bottom right, color-mix(in srgb, var(--primary) 20%, transparent), var(--muted))';
      const label = document.createElement('span');
      label.className = 'nds-text-h3 nds-font-semibold nds-text-foreground';
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
      await expect(canvas.getAllByText('Foto 1').length).toBeGreaterThan(0);
      await expect(canvas.getByRole('button', { name: /next slide/i })).toBeVisible();
    });
  },
};
