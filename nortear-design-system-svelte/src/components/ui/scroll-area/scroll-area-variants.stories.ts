import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { expect } from 'storybook/test';
import { transbordo } from '@shared/testing/scroll-area-probe';
import ScrollAreaStory from './ScrollAreaStory.svelte';
import {
  scrollAreaBothSource,
  scrollAreaHorizontalSource,
  scrollAreaSource,
  scrollAreaVerticalSource,
} from './scroll-area.source';

const meta: Meta = {
  title: 'UI/ScrollArea/Variants',
  component: ScrollAreaStory,
  tags: ['layout'],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // Cascateia para todas as stories do arquivo; cada uma sobrescreve com a
      // sua própria composição logo abaixo.
      source: { transform: scrollAreaSource },
      description: {
        component:
          'Variantes do ScrollArea — vertical (lista longa), horizontal (cards inline) e both (bidirecional para tabelas/matrizes). A direção nasce do conteúdo: o eixo que transborda é o eixo que rola.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/** Barras montadas no DOM, por eixo. */
function barras(raiz: HTMLElement, orientation: 'vertical' | 'horizontal') {
  return raiz.querySelectorAll(
    `[data-slot="scroll-area-scrollbar"][data-orientation="${orientation}"]`,
  );
}

export const Vertical: Story = {
  parameters: {
    covers: ['visual.item1'],
    docs: { source: { transform: scrollAreaVerticalSource } },
  },
  render: () => ({
    Component: ScrollAreaStory,
    props: {
      variant: 'vertical',
      // type: 'always' — o padrao 'hover' so materializa a scrollbar durante o
      // ponteiro sobre a area: a story existe para MOSTRAR a barra, e nem o
      // Chromatic nem a assercao viam nada.
      type: 'always',
      size: 'xl',
      width: '320px',
      itemCount: 30,
      tagLabel: 'Tag',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const viewport = canvasElement.querySelector<HTMLElement>(
      '[data-slot="scroll-area-viewport"]',
    )!;

    await step('Rola só na vertical', async () => {
      // A direção nasce do conteúdo: afirmar a classe da barra provaria apenas
      // que alguém escreveu a classe. O que decide é qual eixo transborda.
      const eixos = transbordo(viewport);
      await expect(eixos.y).toBe(true);
      await expect(eixos.x).toBe(false);
    });

    await step('Só a barra vertical é montada', async () => {
      await expect(barras(canvasElement, 'vertical').length).toBe(1);
      await expect(barras(canvasElement, 'horizontal').length).toBe(0);
    });
  },
};

export const Horizontal: Story = {
  parameters: {
    covers: ['visual.item2'],
    docs: { source: { transform: scrollAreaHorizontalSource } },
  },
  render: () => ({
    Component: ScrollAreaStory,
    props: {
      variant: 'horizontal',
      // type: 'always' — mesmo motivo da Vertical.
      type: 'always',
      size: 'md',
      width: '500px',
      itemCount: 10,
      cardLabel: 'Card',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const viewport = canvasElement.querySelector<HTMLElement>(
      '[data-slot="scroll-area-viewport"]',
    )!;

    await step('Rola só na horizontal', async () => {
      // Antes procurava '.flex.w-max' — Tailwind morto. A asserção é o contrato
      // real: o conteúdo é mais largo que a viewport, que é o que faz a barra
      // existir.
      const eixos = transbordo(viewport);
      await expect(eixos.x).toBe(true);
      await expect(eixos.y).toBe(false);
    });

    await step('A barra horizontal é montada e o eixo responde', async () => {
      await expect(barras(canvasElement, 'horizontal').length).toBe(1);
      viewport.scrollLeft = 0;
      viewport.scrollLeft = 60;
      await expect(viewport.scrollLeft).toBe(60);
    });
  },
};

export const Both: Story = {
  parameters: {
    covers: ['visual.item3'],
    docs: { source: { transform: scrollAreaBothSource } },
  },
  render: () => ({
    Component: ScrollAreaStory,
    props: {
      variant: 'both',
      // type: 'always' — mesmo motivo da Vertical.
      type: 'always',
      size: 'lg',
      width: '500px',
      rowCount: 12,
      colCount: 12,
    },
  }),
  play: async ({ canvasElement, step }) => {
    const viewport = canvasElement.querySelector<HTMLElement>(
      '[data-slot="scroll-area-viewport"]',
    )!;

    await step('Rola nos dois eixos', async () => {
      const eixos = transbordo(viewport);
      await expect(eixos.x).toBe(true);
      await expect(eixos.y).toBe(true);
    });

    await step('As duas barras são montadas', async () => {
      await expect(barras(canvasElement, 'vertical').length).toBe(1);
      await expect(barras(canvasElement, 'horizontal').length).toBe(1);
    });

    await step('Os dois eixos respondem', async () => {
      viewport.scrollTop = 0;
      viewport.scrollLeft = 0;
      viewport.scrollTop = 40;
      viewport.scrollLeft = 40;
      await expect(viewport.scrollTop).toBe(40);
      await expect(viewport.scrollLeft).toBe(40);
    });
  },
};
