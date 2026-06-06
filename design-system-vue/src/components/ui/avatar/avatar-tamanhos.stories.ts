import type { Meta, StoryObj } from '@storybook/vue3';
import { expect } from 'storybook/test';
import { Avatar, AvatarImage, AvatarFallback } from './index';

const meta = {
  title: 'UI/Avatar/Tamanhos',
  component: Avatar,
  tags: ['display'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      description: {
        component:
          'Tamanhos são controlados via className (h-6 w-6, h-8 w-8 padrão, h-10 w-10, h-12 w-12). Não existe prop size.',
      },
    },
  },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

const demoSrc =
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format';
const demoAlt = 'Foto de perfil de Maria Rodrigues';

export const Size6: Story = {
  render: () => ({
    components: { Avatar, AvatarImage, AvatarFallback },
    setup() { return { demoSrc, demoAlt }; },
    template: `
      <Avatar class="h-6 w-6">
        <AvatarImage :src="demoSrc" :alt="demoAlt" />
        <AvatarFallback class="text-[0.625rem]">MR</AvatarFallback>
      </Avatar>
    `,
  }),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.firstElementChild).toBeTruthy();
  },
};

export const Size8: Story = {
  name: 'Size8 (default)',
  render: () => ({
    components: { Avatar, AvatarImage, AvatarFallback },
    setup() { return { demoSrc, demoAlt }; },
    template: `
      <Avatar>
        <AvatarImage :src="demoSrc" :alt="demoAlt" />
        <AvatarFallback class="text-xs">MR</AvatarFallback>
      </Avatar>
    `,
  }),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.firstElementChild).toBeTruthy();
  },
};

export const Size10: Story = {
  render: () => ({
    components: { Avatar, AvatarImage, AvatarFallback },
    setup() { return { demoSrc, demoAlt }; },
    template: `
      <Avatar class="h-10 w-10">
        <AvatarImage :src="demoSrc" :alt="demoAlt" />
        <AvatarFallback>MR</AvatarFallback>
      </Avatar>
    `,
  }),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.firstElementChild).toBeTruthy();
  },
};

export const Size12: Story = {
  render: () => ({
    components: { Avatar, AvatarImage, AvatarFallback },
    setup() { return { demoSrc, demoAlt }; },
    template: `
      <Avatar class="h-12 w-12">
        <AvatarImage :src="demoSrc" :alt="demoAlt" />
        <AvatarFallback>MR</AvatarFallback>
      </Avatar>
    `,
  }),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.firstElementChild).toBeTruthy();
  },
};
