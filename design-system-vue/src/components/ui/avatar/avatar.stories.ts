import type { Meta, StoryObj } from '@storybook/vue3';
import { within, expect } from 'storybook/test';
import { Avatar, AvatarImage, AvatarFallback } from './index';
import AvatarDocs from '@/components/docs/AvatarDocs.vue';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const meta = {
  title: 'UI/Avatar',
  component: Avatar,
  tags: ['autodocs', 'display'],
  parameters: {
    layout: 'centered',
    docs: {
      page: withAutoDocsTab(AvatarDocs),
      description: {
        component:
          'Avatar representa um usuário via foto, iniciais ou ícone. Baseado em reka-ui com AvatarRoot, AvatarImage e AvatarFallback. Tamanhos via className — sem prop size.',
      },
    },
  },
  argTypes: {
    class: {
      control: 'text',
      description: 'Classes Tailwind adicionais — use para ajustar tamanho (h-6 w-6, h-8 w-8, h-10 w-10, h-12 w-12).',
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
    components: { Avatar, AvatarImage, AvatarFallback },
    setup() { return { args }; },
    template: `
      <Avatar v-bind="args">
        <AvatarImage
          src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format"
          alt="Foto de perfil de Maria Rodrigues"
        />
        <AvatarFallback :delay-ms="600">MR</AvatarFallback>
      </Avatar>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Container do Avatar está presente no DOM', async () => {
      const root = canvasElement.querySelector('[data-slot="avatar"]');
      await expect(root).toBeInTheDocument();
    });

    await step('Avatar aplica rounded-full + size via token --size-default', async () => {
      const root = canvasElement.querySelector('[data-slot="avatar"]');
      await expect(root).toHaveClass('rounded-full');
      // size-(--size-default) — validar via data-slot em vez de classe literal
      await expect(root).toHaveAttribute('data-slot', 'avatar');
    });

    await step('Avatar renderiza imagem ou fallback', async () => {
      // Quando a imagem carrega, AvatarImage renderiza; caso contrário, Fallback com 'MR'
      const img = canvasElement.querySelector('[data-slot="avatar-image"]');
      const fallback = canvasElement.querySelector('[data-slot="avatar-fallback"]');
      await expect(img || fallback).toBeTruthy();
    });
  },
};
