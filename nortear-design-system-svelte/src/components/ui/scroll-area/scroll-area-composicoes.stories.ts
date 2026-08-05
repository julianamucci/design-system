import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { within, expect } from 'storybook/test';
import ScrollAreaStory from './ScrollAreaStory.svelte';

const meta: Meta = {
  title: 'UI/ScrollArea/Composicoes',
  component: ScrollAreaStory,
  tags: ['layout'],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Composicoes reais do ScrollArea — lista em sidebar, galeria horizontal de cards e tabela ampla com scroll bidirecional.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const SidebarList: Story = {
  render: () => ({
    Component: ScrollAreaStory,
    props: {
      variant: 'vertical',
      // type: 'always' — o padrao 'hover' so materializa a scrollbar durante o
      // ponteiro sobre a area: a story existe para MOSTRAR a barra, e nem o
      // Chromatic nem a assercao viam nada.
      type: 'always',
      type: 'hover',
      height: '360px',
      width: '260px',
      itemCount: 40,
      tagLabel: 'Item',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Lista renderizada com 40 itens', async () => {
      await expect(canvas.getByText(/Item 1$/)).toBeInTheDocument();
      await expect(canvas.getByText(/Item 40$/)).toBeInTheDocument();
    });
  },
};

export const HorizontalGallery: Story = {
  render: () => ({
    Component: ScrollAreaStory,
    props: {
      variant: 'horizontal',
      // type: 'always' — o padrao 'hover' so materializa a scrollbar durante o
      // ponteiro sobre a area: a story existe para MOSTRAR a barra, e nem o
      // Chromatic nem a assercao viam nada.
      type: 'always',
      type: 'always',
      height: '180px',
      width: '500px',
      itemCount: 10,
      cardLabel: 'Card',
    },
  }),
  play: async ({ canvasElement, step }) => {
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

export const WideTable: Story = {
  render: () => ({
    Component: ScrollAreaStory,
    props: {
      variant: 'both',
      // type: 'always' — o padrao 'hover' so materializa a scrollbar durante o
      // ponteiro sobre a area: a story existe para MOSTRAR a barra, e nem o
      // Chromatic nem a assercao viam nada.
      type: 'always',
      type: 'always',
      height: '300px',
      width: '500px',
      rowCount: 15,
      colCount: 15,
    },
  }),
  play: async ({ canvasElement, step }) => {
    await step('Tabela com ambas as scrollbars renderizada', async () => {
      const v = canvasElement.querySelector(
        '[data-slot="scroll-area-scrollbar"][data-orientation="vertical"]'
      );
      const h = canvasElement.querySelector(
        '[data-slot="scroll-area-scrollbar"][data-orientation="horizontal"]'
      );
      await expect(v).toBeInTheDocument();
      await expect(h).toBeInTheDocument();
    });
    await step('Cell R1·C1 visível', async () => {
      const canvas = within(canvasElement);
      await expect(canvas.getByText('R1·C1')).toBeInTheDocument();
    });
  },
};
