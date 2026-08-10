import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { expect, waitFor } from 'storybook/test';
import ScrollAreaStory from './ScrollAreaStory.svelte';

const meta: Meta = {
  title: 'UI/ScrollArea/Variants',
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
};

export default meta;
type Story = StoryObj;

export const Vertical: Story = {
  render: () => ({
    Component: ScrollAreaStory,
    props: {
      variant: 'vertical',
      // type: 'always' — o padrao 'hover' so materializa a scrollbar durante o
      // ponteiro sobre a area: a story existe para MOSTRAR a barra, e nem o
      // Chromatic nem a assercao viam nada.
      type: 'always',
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
      // type: 'always' — o padrao 'hover' so materializa a scrollbar durante o
      // ponteiro sobre a area: a story existe para MOSTRAR a barra, e nem o
      // Chromatic nem a assercao viam nada.
      type: 'always',
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
    await step('Conteúdo transborda na horizontal', async () => {
      // Antes procurava '.flex.w-max' — Tailwind morto, a faixa usa .nds-row.
      // A asserção passa a ser o contrato real: o conteúdo é mais largo que a
      // viewport, que é o que faz a scrollbar existir.
      const inner = canvasElement.querySelector('.nds-row');
      await expect(inner).toBeInTheDocument();
      const vp = canvasElement.querySelector('[data-slot="scroll-area-viewport"]')!;
      await expect(vp.scrollWidth).toBeGreaterThan(vp.clientWidth);
    });
  },
};

export const Both: Story = {
  render: () => ({
    Component: ScrollAreaStory,
    props: {
      variant: 'both',
      // type: 'always' — o padrao 'hover' so materializa a scrollbar durante o
      // ponteiro sobre a area: a story existe para MOSTRAR a barra, e nem o
      // Chromatic nem a assercao viam nada.
      type: 'always',
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
