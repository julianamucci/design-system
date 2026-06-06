import type { Meta, StoryObj } from '@storybook/svelte';

import { within, expect } from 'storybook/test';
import { Carousel } from './index';
import CarouselStory from './CarouselStory.svelte';
import CarouselDocs from '@/components/docs/CarouselDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const meta = {
  title: 'UI/Carousel',
  component: Carousel,
  tags: ['autodocs', 'display'],
  parameters: {
    layout: 'centered',
    docs: { page: withAutoDocsTab(CarouselDocs) },
  },
  argTypes: {
    orientation: {
      control: 'select',
      options: ['horizontal', 'vertical'],
      description: 'Direção dos slides.',
    },
  },
  args: {
    orientation: 'horizontal',
  },
} satisfies Meta<typeof Carousel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => ({
    Component: CarouselStory,
    props: {
      variant: 'single',
      orientation: args.orientation,
      slideCount: 5,
      ariaLabel: 'Galeria de exemplos',
      previousLabel: 'Item anterior',
      nextLabel: 'Próximo item',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Container com role=region e aria-roledescription=carousel', async () => {
      const region = canvas.getByRole('region', { name: /Galeria de exemplos/i });
      await expect(region).toBeInTheDocument();
      await expect(region).toHaveAttribute('aria-roledescription', 'carousel');
    });

    await step('Slides têm role=group e aria-roledescription=slide', async () => {
      const slides = canvasElement.querySelectorAll('[data-slot="carousel-item"]');
      await expect(slides.length).toBeGreaterThan(0);
      for (const slide of Array.from(slides)) {
        await expect(slide).toHaveAttribute('role', 'group');
        await expect(slide).toHaveAttribute('aria-roledescription', 'slide');
      }
    });

    await step('Botão "Item anterior" existe', async () => {
      const prev = canvas.getByRole('button', { name: /Item anterior/i });
      await expect(prev).toBeInTheDocument();
    });

    await step('Botão "Próximo item" existe', async () => {
      const next = canvas.getByRole('button', { name: /Próximo item/i });
      await expect(next).toBeInTheDocument();
    });
  },
};
