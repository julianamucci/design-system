import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { within, expect } from 'storybook/test';
import ResizableStory from './ResizableStory.svelte';
import { fracoes } from './resizable.fixtures';
import {
  resizableDivisaoVerticalSource,
  resizableEditorPreviewSource,
  resizableIdeSource,
  resizableSidebarSource,
  resizableSource,
} from './resizable.source';

const meta: Meta = {
  title: 'UI/Resizable/Compositions',
  component: ResizableStory,
  tags: ['layout'],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // Cascateia para todas as stories do arquivo; cada uma sobrescreve com a
      // sua própria composição logo abaixo.
      source: { transform: resizableSource },
      description: {
        component:
          'Composicoes reais do Resizable — Sidebar + Conteúdo, Editor + Preview, Lista + Detalhe empilhados e layout aninhado tipo IDE (Sidebar | Editor / Console).',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const SidebarLayout: Story = {
  parameters: {
    docs: { source: { transform: resizableSidebarSource } },
  },
  render: () => ({
    Component: ResizableStory,
    props: {
      variant: 'simples',
      direction: 'horizontal',
      withHandle: true,
      defaultSize: 30,
      minSize: 20,
      labelA: 'Navegação',
      labelB: 'Conteúdo principal',
      ariaLabel: 'Redimensionar sidebar — use setas para ajustar',
      height: '280px',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Sidebar e conteúdo renderizados', async () => {
      await expect(canvas.getByText('Navegação')).toBeVisible();
      await expect(canvas.getByText('Conteúdo principal')).toBeVisible();
    });
    await step('A sidebar ocupa a fatia declarada', async () => {
      await expect(fracoes(canvasElement)[0]).toBeCloseTo(0.3, 1);
    });
    await step('Handle com aria-label contextual', async () => {
      await expect(canvas.getByRole('separator', { name: /sidebar/i })).toBeInTheDocument();
    });
  },
};

export const EditorPreview: Story = {
  parameters: {
    docs: { source: { transform: resizableEditorPreviewSource } },
  },
  render: () => ({
    Component: ResizableStory,
    props: {
      variant: 'simples',
      direction: 'horizontal',
      withHandle: true,
      defaultSize: 50,
      minSize: 20,
      labelA: 'Editor',
      labelB: 'Preview',
      ariaLabel: 'Redimensionar editor e preview — use setas',
      height: '320px',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Editor e Preview visíveis', async () => {
      await expect(canvas.getByText('Editor')).toBeVisible();
      await expect(canvas.getByText('Preview')).toBeVisible();
    });
    await step('E dividem a largura ao meio', async () => {
      await expect(fracoes(canvasElement)[0]).toBeCloseTo(0.5, 1);
    });
  },
};

export const VerticalSplit: Story = {
  parameters: {
    docs: { source: { transform: resizableDivisaoVerticalSource } },
  },
  render: () => ({
    Component: ResizableStory,
    props: {
      variant: 'simples',
      direction: 'vertical',
      withHandle: true,
      defaultSize: 40,
      minSize: 20,
      labelA: 'Lista',
      labelB: 'Detalhe',
      ariaLabel: 'Redimensionar lista e detalhe — use setas',
      height: '360px',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Lista e detalhe empilhados dividem a ALTURA em 40/60', async () => {
      // A asserção anterior era `canvasElement.firstElementChild` ser truthy:
      // passava com a tela vazia, com o eixo trocado e com os dois painéis do
      // mesmo tamanho. A medida agora é a proporção que a story demonstra.
      const [a, b] = fracoes(canvasElement, 'vertical');
      await expect(a).toBeCloseTo(0.4, 1);
      await expect(b).toBeCloseTo(0.6, 1);
    });

    await step('E o divisor é uma linha deitada', async () => {
      await expect(
        canvas.getByRole('separator', { name: /lista e detalhe/i }),
      ).toHaveAttribute('aria-orientation', 'horizontal');
    });
  },
};

export const IDELayout: Story = {
  parameters: {
    docs: { source: { transform: resizableIdeSource } },
  },
  render: () => ({
    Component: ResizableStory,
    props: {
      variant: 'nested',
      direction: 'horizontal',
      withHandle: true,
      defaultSize: 30,
      minSize: 20,
      labelA: 'Arquivos',
      innerTop: 'Editor',
      innerBottom: 'Console',
      ariaLabel: 'Redimensionar arquivos e área principal — use setas',
      innerAriaLabel: 'Redimensionar editor e console — use setas',
      height: '380px',
    },
  }),
  play: async ({ canvasElement, step }) => {
    await step('Composição IDE com 2 grupos e 4 painéis', async () => {
      const groups = canvasElement.querySelectorAll('[data-slot="resizable-pane-group"]');
      await expect(groups).toHaveLength(2);
      const panels = canvasElement.querySelectorAll('[data-slot="resizable-panel"]');
      await expect(panels).toHaveLength(4);
    });

    await step('Os dois divisores têm eixos distintos', async () => {
      const eixos = [...canvasElement.querySelectorAll('[data-slot="resizable-handle"]')].map((h) =>
        h.getAttribute('aria-orientation'),
      );
      await expect(eixos).toContain('vertical');
      await expect(eixos).toContain('horizontal');
    });
  },
};
