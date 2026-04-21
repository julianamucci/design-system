import type { Meta, StoryObj } from '@storybook/svelte';
import { Avatar } from './index';
import AvatarStory from './AvatarStory.svelte';

const meta = {
  title: 'UI/Avatar/Composições',
  component: Avatar,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Composições do Avatar: imagem, iniciais, ícone, agrupamento e com indicador de status.',
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
};

export const WithInitials: Story = {
  render: () => ({
    Component: AvatarStory,
    props: {
      variant: 'initials',
      initials: 'JP',
    },
  }),
};

export const WithIcon: Story = {
  render: () => ({
    Component: AvatarStory,
    props: {
      variant: 'icon',
    },
  }),
};

export const Group: Story = {
  render: () => ({
    Component: AvatarStory,
    props: {
      variant: 'group',
    },
  }),
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
};
