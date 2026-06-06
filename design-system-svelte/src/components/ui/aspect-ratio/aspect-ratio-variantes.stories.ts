import type { Meta, StoryObj } from '@storybook/svelte';

import { expect, waitFor } from 'storybook/test';
import AspectRatioStory from './AspectRatioStory.svelte';

const meta = {
  title: 'UI/AspectRatio/Variantes',
  component: AspectRatioStory,
  tags: ['layout'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      description: {
        component:
          'Cinco ratios canônicos adotados no design system: 16/9, 4/3, 1/1, 3/4 e 21/9.',
      },
    },
  },
} satisfies Meta<typeof AspectRatioStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SixteenNine: Story = {
  args: {
    ratio: 16 / 9,
    child: 'img',
    src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&auto=format&fit=crop&q=60',
    alt: 'Paisagem 16:9',
    width: 'max-w-lg',
  },

  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.firstElementChild).toBeTruthy());
  },
};

export const FourThree: Story = {
  args: {
    ratio: 4 / 3,
    child: 'img',
    src: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=900&auto=format&fit=crop&q=60',
    alt: 'Imagem de produto 4:3',
    width: 'max-w-md',
  },

  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.firstElementChild).toBeTruthy());
  },
};

export const Square: Story = {
  args: {
    ratio: 1,
    child: 'img',
    src: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=60',
    alt: 'Avatar quadrado 1:1',
    width: 'max-w-[12rem]',
  },

  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.firstElementChild).toBeTruthy());
  },
};

export const ThreeFour: Story = {
  args: {
    ratio: 3 / 4,
    child: 'img',
    src: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=600&auto=format&fit=crop&q=60',
    alt: 'Retrato 3:4',
    width: 'max-w-[14rem]',
  },

  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.firstElementChild).toBeTruthy());
  },
};

export const UltraWide: Story = {
  args: {
    ratio: 21 / 9,
    child: 'img',
    src: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1600&auto=format&fit=crop&q=60',
    alt: 'Hero panorâmico 21:9',
    width: 'max-w-2xl',
  },

  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.firstElementChild).toBeTruthy());
  },
};
