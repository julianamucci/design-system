import type { Meta, StoryObj } from '@storybook/svelte';

import { expect, waitFor } from 'storybook/test';
import ScrollAreaStory from './ScrollAreaStory.svelte';

const meta = {
  title: 'UI/ScrollArea/Variantes',
  component: ScrollAreaStory,
  tags: ['layout'],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Variantes do ScrollArea — vertical (lista longa), horizontal (cards inline) e both (bidirecional para tabelas/matrizes).',
      },
    },
  },
} satisfies Meta<typeof ScrollAreaStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Vertical: Story = {
  render: () => ({
    Component: ScrollAreaStory,
    props: {
      variant: 'vertical',
      height: '300px',
      width: '320px',
      itemCount: 30,
      tagLabel: 'Tag',
    },
  }),
  play: async ({ canvasElement, step }) => {
    await step('Scrollbar vertical presente', async () => {
      await waitFor(() => {
        const scrollbar = canvasElement.querySelector(
          '[data-slot="scroll-area-scrollbar"][data-orientation="vertical"]'
        );
        expect(scrollbar).toBeInTheDocument();
      });
    });
    await step('Scrollbar horizontal ausente', async () => {
      const horizontal = canvasElement.querySelector(
        '[data-slot="scroll-area-scrollbar"][data-orientation="horizontal"]'
      );
      await expect(horizontal).toBeNull();
    });
  },
};

export const Horizontal: Story = {
  render: () => ({
    Component: ScrollAreaStory,
    props: {
      variant: 'horizontal',
      height: '180px',
      width: '500px',
      itemCount: 10,
      cardLabel: 'Card',
    },
  }),
  play: async ({ canvasElement, step }) => {
    await step('Scrollbar horizontal presente', async () => {
      await waitFor(() => {
        const scrollbar = canvasElement.querySelector(
          '[data-slot="scroll-area-scrollbar"][data-orientation="horizontal"]'
        );
        expect(scrollbar).toBeInTheDocument();
      });
    });
    await step('Conteúdo em flex w-max', async () => {
      const inner = canvasElement.querySelector('.flex.w-max');
      await expect(inner).toBeInTheDocument();
    });
  },
};

export const Both: Story = {
  render: () => ({
    Component: ScrollAreaStory,
    props: {
      variant: 'both',
      height: '260px',
      width: '500px',
      rowCount: 12,
      colCount: 12,
    },
  }),
  play: async ({ canvasElement, step }) => {
    await step('Scrollbar vertical presente', async () => {
      await waitFor(() => {
        const v = canvasElement.querySelector(
          '[data-slot="scroll-area-scrollbar"][data-orientation="vertical"]'
        );
        expect(v).toBeInTheDocument();
      });
    });
    await step('Scrollbar horizontal presente', async () => {
      await waitFor(() => {
        const h = canvasElement.querySelector(
          '[data-slot="scroll-area-scrollbar"][data-orientation="horizontal"]'
        );
        expect(h).toBeInTheDocument();
      });
    });
  },
};
