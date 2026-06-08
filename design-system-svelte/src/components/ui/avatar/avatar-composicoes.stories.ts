import type { Meta, StoryObj } from '@storybook/svelte';

import { expect, waitFor } from 'storybook/test';
import { Avatar } from './index';
import AvatarStory from './AvatarStory.svelte';

const meta = {
  title: 'UI/Avatar/Composicoes',
  component: Avatar,
  tags: ['display'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      description: {
        component:
          'Composicoes do Avatar: imagem, iniciais, ícone, agrupamento e com indicador de status.',
      },
    },
  },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithImage: Story = {
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

export const WithInitials: Story = {
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

export const WithIcon: Story = {
  render: () => ({
    Component: AvatarStory,
    props: {
      variant: 'icon',
    },
  }),

  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.firstElementChild).toBeTruthy());
  },
};

export const Group: Story = {
  render: () => ({
    Component: AvatarStory,
    props: {
      variant: 'group',
    },
  }),

  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.firstElementChild).toBeTruthy());
  },
};

export const WithStatus: Story = {
  render: () => ({
    Component: AvatarStory,
    props: {
      variant: 'withStatus',
      src: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=60',
      alt: 'Foto de perfil de Maria Rodrigues',
      initials: 'MR',
      statusLabel: 'online',
    },
  }),

  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.firstElementChild).toBeTruthy());
  },
};
