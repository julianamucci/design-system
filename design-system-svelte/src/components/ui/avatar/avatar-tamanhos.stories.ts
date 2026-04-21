import type { Meta, StoryObj } from '@storybook/svelte';
import { Avatar } from './index';
import AvatarStory from './AvatarStory.svelte';

const meta = {
  title: 'UI/Avatar/Tamanhos',
  component: Avatar,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Tamanhos do Avatar aplicados via className (não via prop): h-6, h-8, h-10 (padrão) e h-12.',
      },
    },
  },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

const baseProps = {
  variant: 'image' as const,
  src: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=60',
  alt: 'Foto de perfil de Maria Rodrigues',
  initials: 'MR',
};

export const Size6: Story = {
  name: 'h-6 w-6',
  render: () => ({
    Component: AvatarStory,
    props: { ...baseProps, sizeClass: 'h-6 w-6' },
  }),
};

export const Size8: Story = {
  name: 'h-8 w-8',
  render: () => ({
    Component: AvatarStory,
    props: { ...baseProps, sizeClass: 'h-8 w-8' },
  }),
};

export const Size10: Story = {
  name: 'h-10 w-10 (default)',
  render: () => ({
    Component: AvatarStory,
    props: { ...baseProps, sizeClass: 'h-10 w-10' },
  }),
};

export const Size12: Story = {
  name: 'h-12 w-12',
  render: () => ({
    Component: AvatarStory,
    props: { ...baseProps, sizeClass: 'h-12 w-12' },
  }),
};
