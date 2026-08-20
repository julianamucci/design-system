import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { within, expect, userEvent } from 'storybook/test';
import { transbordo } from '@shared/testing/scroll-area-probe';
import ScrollAreaStory from './ScrollAreaStory.svelte';
import {
  scrollAreaHorizontalSource,
  scrollAreaListaEmSidebarSource,
  scrollAreaSource,
  scrollAreaTabelaAmplaSource,
} from './scroll-area.source';

const meta: Meta = {
  title: 'UI/ScrollArea/Compositions',
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
          'Composicoes reais do ScrollArea — lista em sidebar, galeria horizontal de cards e tabela ampla com scroll bidirecional.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const SidebarList: Story = {
  parameters: {
    docs: { source: { transform: scrollAreaListaEmSidebarSource } },
  },
  render: () => ({
    Component: ScrollAreaStory,
    props: {
      variant: 'links',
      type: 'hover',
      size: 'xl',
      width: '260px',
      itemCount: 40,
      tagLabel: 'Item',
      navLabel: 'Seções da documentação',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const viewport = canvasElement.querySelector<HTMLElement>(
      '[data-slot="scroll-area-viewport"]',
    )!;

    await step('A navegação tem nome acessível e mora dentro da área rolável', async () => {
      const nav = canvas.getByRole('navigation', { name: 'Seções da documentação' });
      await expect(viewport.contains(nav)).toBe(true);
      await expect(transbordo(viewport).y).toBe(true);
    });

    await step('Os links são alcançáveis por teclado, na ordem do documento', async () => {
      const links = canvas.getAllByRole('link');
      await expect(links.length).toBe(40);
      viewport.blur();
      viewport.focus();
      await userEvent.tab();
      await expect(document.activeElement).toBe(links[0]);
    });
  },
};

export const HorizontalGallery: Story = {
  parameters: {
    // Mesma faixa da variante horizontal — a galeria é o uso real dela.
    docs: { source: { transform: scrollAreaHorizontalSource } },
  },
  render: () => ({
    Component: ScrollAreaStory,
    props: {
      variant: 'horizontal',
      // type: 'always' — o padrao 'hover' so materializa a scrollbar durante o
      // ponteiro sobre a area: a story existe para MOSTRAR a barra, e nem o
      // Chromatic nem a assercao viam nada.
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

    await step('A faixa transborda na horizontal', async () => {
      // Antes procurava '.flex.w-max' — Tailwind morto, a faixa usa .nds-row.
      // A asserção passa a ser o contrato real: o conteúdo é mais largo que a
      // viewport, que é o que faz a barra existir.
      const inner = canvasElement.querySelector('.nds-row');
      await expect(inner).toBeInTheDocument();
      await expect(transbordo(viewport).x).toBe(true);
    });

    await step('A barra horizontal é montada e o eixo responde', async () => {
      const h = canvasElement.querySelectorAll(
        '[data-slot="scroll-area-scrollbar"][data-orientation="horizontal"]',
      );
      await expect(h.length).toBe(1);
      viewport.scrollLeft = 0;
      viewport.scrollLeft = 120;
      await expect(viewport.scrollLeft).toBe(120);
    });
  },
};

export const WideTable: Story = {
  parameters: {
    docs: { source: { transform: scrollAreaTabelaAmplaSource } },
  },
  render: () => ({
    Component: ScrollAreaStory,
    props: {
      variant: 'both',
      type: 'always',
      size: 'xl',
      width: '500px',
      rowCount: 15,
      colCount: 15,
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const viewport = canvasElement.querySelector<HTMLElement>(
      '[data-slot="scroll-area-viewport"]',
    )!;

    await step('A tabela transborda nos dois eixos', async () => {
      const eixos = transbordo(viewport);
      await expect(eixos.x).toBe(true);
      await expect(eixos.y).toBe(true);
    });

    await step('As duas barras são montadas', async () => {
      const v = canvasElement.querySelectorAll(
        '[data-slot="scroll-area-scrollbar"][data-orientation="vertical"]',
      );
      const h = canvasElement.querySelectorAll(
        '[data-slot="scroll-area-scrollbar"][data-orientation="horizontal"]',
      );
      await expect(v.length).toBe(1);
      await expect(h.length).toBe(1);
    });

    await step('A célula do canto continua no DOM', async () => {
      await expect(canvas.getByText('R1·C1')).toBeInTheDocument();
    });
  },
};
