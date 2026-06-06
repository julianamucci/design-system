import type { Meta, StoryObj } from '@storybook/svelte';

import { expect, waitFor } from 'storybook/test';
import ScrollAreaStory from './ScrollAreaStory.svelte';

const meta = {
  title: 'UI/ScrollArea/Estados',
  component: ScrollAreaStory,
  tags: ['layout'],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Estados visuais do ScrollArea — idle (padrão), always (scrollbar sempre visível), scroll (visível apenas durante rolagem) e focus (viewport com anel de foco).',
      },
    },
  },
} satisfies Meta<typeof ScrollAreaStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Idle: Story = {
  render: () => ({
    Component: ScrollAreaStory,
    props: {
      variant: 'vertical',
      type: 'hover',
      height: '240px',
      width: '320px',
      itemCount: 20,
    },
  }),
  play: async ({ canvasElement, step }) => {
    await step('Viewport presente', async () => {
      const v = canvasElement.querySelector('[data-slot="scroll-area-viewport"]');
      await expect(v).toBeInTheDocument();
    });
  },
};

export const Always: Story = {
  render: () => ({
    Component: ScrollAreaStory,
    props: {
      variant: 'vertical',
      type: 'always',
      height: '240px',
      width: '320px',
      itemCount: 20,
    },
  }),
  play: async ({ canvasElement, step }) => {
    await step('Scrollbar visível continuamente (type=always)', async () => {
      const scrollbar = canvasElement.querySelector(
        '[data-slot="scroll-area-scrollbar"][data-orientation="vertical"]'
      );
      await expect(scrollbar).toBeInTheDocument();
    });
  },
};

export const ScrollOnly: Story = {
  render: () => ({
    Component: ScrollAreaStory,
    props: {
      variant: 'vertical',
      type: 'scroll',
      scrollHideDelay: 1000,
      height: '240px',
      width: '320px',
      itemCount: 20,
    },
  }),

  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.firstElementChild).toBeTruthy());
  },
};

export const Focus: Story = {
  render: () => ({
    Component: ScrollAreaStory,
    props: {
      variant: 'vertical',
      type: 'always',
      height: '240px',
      width: '320px',
      itemCount: 20,
    },
  }),
  play: async ({ canvasElement, step }) => {
    await step('Viewport recebe foco programaticamente', async () => {
      const viewport = canvasElement.querySelector<HTMLElement>(
        '[data-slot="scroll-area-viewport"]'
      );
      await expect(viewport).toBeInTheDocument();
      viewport?.focus();
    });
  },
};
