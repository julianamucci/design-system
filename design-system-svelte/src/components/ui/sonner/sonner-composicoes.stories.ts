import type { Meta, StoryObj } from '@storybook/svelte';

import { within, expect } from 'storybook/test';
import SonnerToastStory from './SonnerToastStory.svelte';

const meta = {
  title: 'UI/Sonner/Composicoes',
  component: SonnerToastStory,
  tags: ['feedback'],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    docs: {
      description: {
        component: 'Composicoes do Sonner: toast com descrição, ação inline, promise automático e persistente.',
      },
    },
  },
} satisfies Meta<typeof SonnerToastStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithDescription: Story = {
  render: () => ({
    Component: SonnerToastStory,
    props: {
      type: 'success',
      message: 'Preferências atualizadas.',
      description: 'Suas configurações foram salvas e entrarão em vigor na próxima sessão.',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Container do story renderizado', async () => {
      await expect(canvasElement).toBeInTheDocument();
    });
  },
};

export const WithAction: Story = {
  render: () => ({
    Component: SonnerToastStory,
    props: {
      type: 'default',
      message: 'Item excluído.',
      withAction: true,
      actionLabel: 'Desfazer',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Container do story renderizado', async () => {
      await expect(canvasElement).toBeInTheDocument();
    });
  },
};

export const WithPromise: Story = {
  render: () => ({
    Component: SonnerToastStory,
    props: {
      withPromise: true,
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Container do story renderizado', async () => {
      await expect(canvasElement).toBeInTheDocument();
    });
  },
};

export const Persistent: Story = {
  render: () => ({
    Component: SonnerToastStory,
    props: {
      type: 'error',
      message: 'Falha crítica no servidor.',
      persistent: true,
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Container do story renderizado', async () => {
      await expect(canvasElement).toBeInTheDocument();
    });
  },
};
