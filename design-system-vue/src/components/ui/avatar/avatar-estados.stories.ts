import type { Meta, StoryObj } from '@storybook/vue3';
import { within, expect } from 'storybook/test';
import { Avatar, AvatarImage, AvatarFallback } from './index';

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
          'Estados de carregamento do Avatar: loaded (imagem ok), loading (aguardando delayMs), failed (imagem quebrada) e noImage (sem AvatarImage).',
      },
    },
  },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Loaded: Story = {
  render: () => ({
    components: { Avatar, AvatarImage, AvatarFallback },
    template: `
      <Avatar>
        <AvatarImage
          src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format"
          alt="Foto de perfil de Maria Rodrigues"
        />
        <AvatarFallback>MR</AvatarFallback>
      </Avatar>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('Container Avatar presente', async () => {
      const root = canvasElement.querySelector('[data-slot="avatar"]');
      await expect(root).toBeInTheDocument();
    });
  },
};

export const Loading: Story = {
  name: 'Loading (delayMs=600)',
  render: () => ({
    components: { Avatar, AvatarImage, AvatarFallback },
    template: `
      <Avatar>
        <AvatarImage
          src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format"
          alt="Foto de perfil de Maria Rodrigues"
        />
        <AvatarFallback :delay-ms="600">MR</AvatarFallback>
      </Avatar>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    await step('Container Avatar presente', async () => {
      const root = canvasElement.querySelector('[data-slot="avatar"]');
      await expect(root).toBeInTheDocument();
    });
  },
};

export const Failed: Story = {
  render: () => ({
    components: { Avatar, AvatarImage, AvatarFallback },
    template: `
      <Avatar>
        <AvatarImage
          src="https://broken.example.com/not-found.png"
          alt="Foto de perfil de João Pereira"
        />
        <AvatarFallback>JP</AvatarFallback>
      </Avatar>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Fallback exibido após falha da imagem', async () => {
      await expect(await canvas.findByText('JP')).toBeVisible();
    });
  },
};

export const NoImage: Story = {
  render: () => ({
    components: { Avatar, AvatarFallback },
    template: `
      <Avatar>
        <AvatarFallback>JP</AvatarFallback>
      </Avatar>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Fallback exibido imediatamente sem AvatarImage', async () => {
      await expect(canvas.getByText('JP')).toBeVisible();
    });

    await step('Não existe elemento AvatarImage no DOM', async () => {
      const img = canvasElement.querySelector('[data-slot="avatar-image"]');
      await expect(img).toBeNull();
    });
  },
};
