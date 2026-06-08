import type { Meta, StoryObj } from '@storybook/svelte';

import { expect, waitFor } from 'storybook/test';
import AspectRatioStory from './AspectRatioStory.svelte';
import AspectRatioGridStory from './AspectRatioGridStory.svelte';

const meta = {
  title: 'UI/AspectRatio/Composicoes',
  component: AspectRatioStory,
  tags: ['layout'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      description: {
        component:
          'Composicoes comuns do AspectRatio com diferentes tipos de filho: imagem, iframe, vídeo e em grid responsivo.',
      },
    },
  },
} satisfies Meta<typeof AspectRatioStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ComImagem: Story = {
  args: {
    ratio: 16 / 9,
    child: 'img',
    src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&auto=format&fit=crop&q=60',
    alt: 'Paisagem com object-cover',
    width: 'max-w-lg',
  },

  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.firstElementChild).toBeTruthy());
  },
};

export const ComIframe: Story = {
  args: {
    ratio: 16 / 9,
    child: 'iframe',
    src: 'https://www.openstreetmap.org/export/embed.html?bbox=-46.66%2C-23.56%2C-46.62%2C-23.54&layer=mapnik',
    title: 'Mapa do escritório em São Paulo',
    width: 'max-w-lg',
  },

  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.firstElementChild).toBeTruthy());
  },
};

export const ComVideo: Story = {
  args: {
    ratio: 16 / 9,
    child: 'video',
    src: 'https://cdn.coverr.co/videos/coverr-a-quiet-beach-7103/1080p.mp4',
    poster: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=60',
    width: 'max-w-lg',
  },

  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.firstElementChild).toBeTruthy());
  },
};

export const EmGrid: Story = {
  render: () => ({
    Component: AspectRatioGridStory,
  }),
  parameters: {
    layout: 'padded',
  },

  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.firstElementChild).toBeTruthy());
  },
};
