import type { Meta, StoryObj } from '@storybook/vue3';
import { expect } from 'storybook/test';
import { Avatar, AvatarImage, AvatarFallback } from './index';
import { User } from 'lucide-vue-next';

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
          'Composicoes típicas do Avatar: imagem, iniciais, ícone genérico, agrupamento com sobreposição e indicador de status.',
      },
    },
  },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithImage: Story = {
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
  play: async ({ canvasElement }) => {
    await expect(canvasElement.firstElementChild).toBeTruthy();
  },
};

export const WithInitials: Story = {
  render: () => ({
    components: { Avatar, AvatarFallback },
    template: `
      <Avatar>
        <AvatarFallback>JP</AvatarFallback>
      </Avatar>
    `,
  }),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.firstElementChild).toBeTruthy();
  },
};

export const WithIcon: Story = {
  render: () => ({
    components: { Avatar, AvatarFallback, User },
    template: `
      <Avatar>
        <AvatarFallback role="img" aria-label="Usuário genérico">
          <User class="h-5 w-5" aria-hidden="true" />
        </AvatarFallback>
      </Avatar>
    `,
  }),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.firstElementChild).toBeTruthy();
  },
};

export const Group: Story = {
  render: () => ({
    components: { Avatar, AvatarImage, AvatarFallback },
    template: `
      <div class="flex -space-x-2" role="group" aria-label="Participantes">
        <Avatar class="ring-2 ring-background">
          <AvatarImage
            src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format"
            alt="Maria Rodrigues"
          />
          <AvatarFallback aria-hidden="true">MR</AvatarFallback>
        </Avatar>
        <Avatar class="ring-2 ring-background">
          <AvatarImage
            src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&auto=format"
            alt="Alex Silva"
          />
          <AvatarFallback aria-hidden="true">AS</AvatarFallback>
        </Avatar>
        <Avatar class="ring-2 ring-background">
          <AvatarImage
            src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format"
            alt="Carlos Souza"
          />
          <AvatarFallback aria-hidden="true">CS</AvatarFallback>
        </Avatar>
        <Avatar class="ring-2 ring-background">
          <AvatarFallback class="text-xs" aria-hidden="true">+3</AvatarFallback>
        </Avatar>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.firstElementChild).toBeTruthy();
  },
};

export const WithStatus: Story = {
  render: () => ({
    components: { Avatar, AvatarImage, AvatarFallback },
    template: `
      <div class="relative inline-block">
        <Avatar>
          <AvatarImage
            src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format"
            alt="Foto de perfil de Maria Rodrigues"
          />
          <AvatarFallback>MR</AvatarFallback>
        </Avatar>
        <span
          class="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-background"
          role="status"
          aria-label="online"
        />
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.firstElementChild).toBeTruthy();
  },
};
