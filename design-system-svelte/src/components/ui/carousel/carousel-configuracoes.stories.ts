import type { Meta, StoryObj } from '@storybook/svelte';

import { expect, waitFor } from 'storybook/test';
import { Carousel } from './index';
import CarouselStory from './CarouselStory.svelte';

const meta = {
  title: 'UI/Carousel/Configuracoes',
  component: Carousel,
  tags: ['display'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      description: {
        component:
          'Configuracoes comuns: item único, múltiplos itens responsivos (basis-1/2 em md, basis-1/3 em lg) e autoplay via plugin embla-carousel-autoplay.',
      },
    },
  },
} satisfies Meta<typeof Carousel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Single: Story = {
  render: () => ({
    Component: CarouselStory,
    props: {
      variant: 'single',
      slideCount: 5,
      ariaLabel: 'Carrossel com item único',
      previousLabel: 'Item anterior',
      nextLabel: 'Próximo item',
    },
  }),

  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.firstElementChild).toBeTruthy());
  },
};

export const MultiResponsive: Story = {
  render: () => ({
    Component: CarouselStory,
    props: {
      variant: 'multi',
      slideCount: 6,
      widthClass: 'w-full max-w-2xl',
      ariaLabel: 'Carrossel com múltiplos itens responsivos',
      previousLabel: 'Item anterior',
      nextLabel: 'Próximo item',
    },
  }),

  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.firstElementChild).toBeTruthy());
  },
};

export const Autoplay: Story = {
  render: () => ({
    Component: CarouselStory,
    props: {
      variant: 'autoplay',
      slideCount: 5,
      ariaLabel: 'Carrossel com autoplay',
      previousLabel: 'Item anterior',
      nextLabel: 'Próximo item',
    },
  }),

  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.firstElementChild).toBeTruthy());
  },
};
