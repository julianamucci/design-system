import type { Meta, StoryObj } from '@storybook/html';
import { userEvent, within, expect } from 'storybook/test';
import { createCarousel } from './carousel';
import { createCard, createCardContent } from './card';
import { createCarouselDocs } from '@/components/docs/CarouselDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

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

type CarouselArgs = {
  slides: number;
  autoplay: boolean;
  autoplayInterval: number;
};

const meta: Meta<CarouselArgs> = {
  title: 'UI/Carousel',
  tags: ['autodocs', 'display'],
  parameters: {
    layout: 'centered',
    docs: { page: withAutoDocsTab(createCarouselDocs) },
  },
  argTypes: {
    slides: {
      control: { type: 'number', min: 2, max: 10 },
      description: 'Número de slides renderizados dentro do carrossel',
    },
    autoplay: {
      control: 'boolean',
      description: 'Ativa o avanço automático entre slides',
    },
    autoplayInterval: {
      control: { type: 'number', min: 500, max: 10000, step: 500 },
      description: 'Intervalo em milissegundos entre avanços automáticos',
    },
  },
  args: {
    slides: 5,
    autoplay: false,
    autoplayInterval: 3000,
  },
};

export default meta;
type Story = StoryObj<CarouselArgs>;

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  render: (args) => {
    const wrap = document.createElement('div');
    wrap.className = 'nds-w-full nds-max-w-md';
    wrap.appendChild(
      createCarousel({
        items: buildSlides(args.slides),
        autoplay: args.autoplay,
        autoplayInterval: args.autoplayInterval,
      }),
    );
    return wrap;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Carousel renderizado com role=region', async () => {
      const region = canvas.getByRole('region');
      await expect(region).toBeInTheDocument();
      await expect(region).toHaveAttribute('aria-roledescription', 'carousel');
    });

    await step('Botões de navegação presentes com aria-label', async () => {
      await expect(canvas.getByRole('button', { name: /previous slide/i })).toBeVisible();
      await expect(canvas.getByRole('button', { name: /next slide/i })).toBeVisible();
    });

    await step('Clicar em Next avança para o segundo slide', async () => {
      const next = canvas.getByRole('button', { name: /next slide/i });
      await userEvent.click(next);
      const prev = canvas.getByRole('button', { name: /previous slide/i });
      await expect(prev).toHaveAttribute('aria-disabled', 'false');
    });
  },
};
