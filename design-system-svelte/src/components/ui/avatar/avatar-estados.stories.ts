import type { Meta, StoryObj } from '@storybook/svelte';

import { expect, waitFor } from 'storybook/test';
import { Avatar } from './index';
import AvatarStory from './AvatarStory.svelte';

const meta = {
  title: 'UI/Avatar/Estados',
  component: Avatar,
  tags: ['display'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      description: {
        component:
          'Estados de carregamento do Avatar: carregado, carregando (delayMs), falhou e sem imagem.',
      },
    },
  },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Loaded: Story = {
  render: () => ({
    Component: AvatarStory,
    props: {
      variant: 'image',
      src: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=60',
      alt: 'Foto de perfil de Maria Rodrigues',
      initials: 'MR',
    },
  }),

  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.firstElementChild).toBeTruthy());
  },
};

export const Loading: Story = {
  render: () => ({
    Component: AvatarStory,
    props: {
      variant: 'image',
      src: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=60',
      alt: 'Foto de perfil de Maria Rodrigues',
      initials: 'MR',
      delayMs: 600,
    },
  }),

  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.firstElementChild).toBeTruthy());
  },
};

export const Failed: Story = {
  render: () => ({
    Component: AvatarStory,
    props: {
      variant: 'image',
      src: 'https://invalid.example.com/not-found-image.jpg',
      alt: 'Foto de perfil de Maria Rodrigues',
      initials: 'MR',
    },
  }),

  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.firstElementChild).toBeTruthy());
  },
};

export const NoImage: Story = {
  render: () => ({
    Component: AvatarStory,
    props: {
      variant: 'initials',
      initials: 'JP',
    },
  }),

  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.firstElementChild).toBeTruthy());
  },
};
