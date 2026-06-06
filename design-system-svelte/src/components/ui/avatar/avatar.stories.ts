import type { Meta, StoryObj } from '@storybook/svelte';

import { within, expect } from 'storybook/test';
import { Avatar } from './index';
import AvatarStory from './AvatarStory.svelte';
import AvatarDocs from '@/components/docs/AvatarDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const meta = {
  title: 'UI/Avatar',
  component: Avatar,
  tags: ['autodocs', 'display'],
  parameters: {
    layout: 'centered',
    docs: { page: withAutoDocsTab(AvatarDocs) },
  },
  argTypes: {
    class: {
      control: 'select',
      options: ['h-6 w-6', 'h-8 w-8', 'h-10 w-10', 'h-12 w-12'],
      description: 'Classe Tailwind para ajustar o diâmetro (padrão: h-8 w-8).',
    },
  },
  args: {
    class: '',
  },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => ({
    Component: AvatarStory,
    props: {
      variant: 'image',
      sizeClass: args.class ?? '',
      src: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=60',
      alt: 'Foto de perfil de Maria Rodrigues',
      initials: 'MR',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Avatar está presente no DOM', async () => {
      const avatar = canvasElement.querySelector('[data-slot="avatar"]');
      await expect(avatar).toBeInTheDocument();
    });

    await step('Avatar tem forma circular via rounded-full', async () => {
      const avatar = canvasElement.querySelector('[data-slot="avatar"]');
      await expect(avatar).toHaveClass('rounded-full');
    });

    await step('AvatarImage possui alt descritivo', async () => {
      const img = await canvas.findByAltText(/Foto de perfil de Maria Rodrigues/i);
      await expect(img).toBeInTheDocument();
    });
  },
};
