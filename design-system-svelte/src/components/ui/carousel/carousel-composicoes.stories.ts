import type { Meta, StoryObj } from '@storybook/svelte';

import { within, expect } from 'storybook/test';
import { Carousel } from './index';
import CarouselStory from './CarouselStory.svelte';

const meta = {
  title: 'UI/Carousel/Composicoes',
  component: Carousel,
  tags: ['display'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      description: {
        component:
          'Composicoes do Carousel: com dots customizados (via CarouselApi) e galeria de imagens.',
      },
    },
  },
} satisfies Meta<typeof Carousel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ComDots: Story = {
  render: () => ({
    Component: CarouselStory,
    props: {
      variant: 'withDots',
      slideCount: 5,
      ariaLabel: 'Carrossel com dots',
      previousLabel: 'Item anterior',
      nextLabel: 'Próximo item',
      goToSlideLabel: 'Ir para o slide',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Dots têm role=tab e aria-label "Ir para o slide N"', async () => {
      const dots = await canvas.findAllByRole('tab', { name: /Ir para o slide/i });
      await expect(dots.length).toBeGreaterThan(0);
    });
  },
};

export const Galeria: Story = {
  render: () => ({
    Component: CarouselStory,
    props: {
      variant: 'gallery',
      ariaLabel: 'Galeria de fotos do produto',
      previousLabel: 'Foto anterior',
      nextLabel: 'Próxima foto',
      images: [
        { src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&auto=format&fit=crop&q=60', alt: 'Paisagem 1' },
        { src: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&auto=format&fit=crop&q=60', alt: 'Paisagem 2' },
        { src: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&auto=format&fit=crop&q=60', alt: 'Paisagem 3' },
        { src: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=800&auto=format&fit=crop&q=60', alt: 'Paisagem 4' },
      ],
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Galeria com aria-label da região', async () => {
      const region = canvas.getByRole('region', { name: /Galeria de fotos do produto/i });
      await expect(region).toHaveAttribute('aria-roledescription', 'carousel');
    });
  },
};
