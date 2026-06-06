import type { Meta, StoryObj } from '@storybook/svelte';

import { within, expect } from 'storybook/test';
import { Carousel } from './index';
import CarouselStory from './CarouselStory.svelte';

const meta = {
  title: 'UI/Carousel/Variantes',
  component: Carousel,
  tags: ['display'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      description: {
        component:
          'Orientações disponíveis: horizontal (padrão) e vertical. A orientação controla o eixo de deslizamento e a posição dos botões de navegação.',
      },
    },
  },
} satisfies Meta<typeof Carousel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {
  render: () => ({
    Component: CarouselStory,
    props: {
      variant: 'single',
      orientation: 'horizontal',
      slideCount: 5,
      ariaLabel: 'Galeria horizontal',
      previousLabel: 'Item anterior',
      nextLabel: 'Próximo item',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Region horizontal com aria-label', async () => {
      const region = canvas.getByRole('region', { name: /Galeria horizontal/i });
      await expect(region).toHaveAttribute('aria-roledescription', 'carousel');
    });
  },
};

export const Vertical: Story = {
  render: () => ({
    Component: CarouselStory,
    props: {
      variant: 'vertical',
      orientation: 'vertical',
      slideCount: 5,
      heightClass: 'h-[260px]',
      ariaLabel: 'Galeria vertical',
      previousLabel: 'Item anterior',
      nextLabel: 'Próximo item',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Region vertical com aria-label', async () => {
      const region = canvas.getByRole('region', { name: /Galeria vertical/i });
      await expect(region).toHaveAttribute('aria-roledescription', 'carousel');
    });
  },
};
