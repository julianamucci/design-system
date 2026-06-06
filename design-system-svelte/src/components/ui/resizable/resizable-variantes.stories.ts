import type { Meta, StoryObj } from '@storybook/svelte';

import { within, expect } from 'storybook/test';
import ResizableStory from './ResizableStory.svelte';

const meta = {
  title: 'UI/Resizable/Variantes',
  component: ResizableStory,
  tags: ['layout'],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Variantes do Resizable — horizontal (split lateral), vertical (split vertical) e nested (PaneGroup dentro de Pane).',
      },
    },
  },
} satisfies Meta<typeof ResizableStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {
  render: () => ({
    Component: ResizableStory,
    props: {
      variant: 'horizontal',
      sidebarLabel: 'Sidebar',
      contentLabel: 'Conteúdo principal',
      ariaLabel: 'Redimensionar painéis — use setas para ajustar',
      height: '240px',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('PaneGroup horizontal renderizado', async () => {
      const group = canvasElement.querySelector('[data-slot="resizable-pane-group"][data-direction="horizontal"]');
      await expect(group).toBeInTheDocument();
    });
    await step('Handle vertical com aria-orientation', async () => {
      const handle = canvas.getByRole('separator', { name: /Redimensionar/ });
      await expect(handle).toHaveAttribute('aria-orientation', 'vertical');
    });
  },
};

export const Vertical: Story = {
  render: () => ({
    Component: ResizableStory,
    props: {
      variant: 'vertical',
      topLabel: 'Topo',
      bottomLabel: 'Rodapé',
      ariaLabel: 'Redimensionar painéis verticalmente — use setas',
      height: '300px',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('PaneGroup vertical renderizado', async () => {
      const group = canvasElement.querySelector('[data-slot="resizable-pane-group"][data-direction="vertical"]');
      await expect(group).toBeInTheDocument();
    });
    await step('Handle horizontal com aria-orientation', async () => {
      const handle = canvas.getByRole('separator', { name: /Redimensionar/ });
      await expect(handle).toHaveAttribute('aria-orientation', 'horizontal');
    });
  },
};

export const Nested: Story = {
  render: () => ({
    Component: ResizableStory,
    props: {
      variant: 'nested',
      sidebarLabel: 'Sidebar',
      topLabel: 'Editor',
      bottomLabel: 'Console',
      ariaLabel: 'Redimensionar painéis — use setas para ajustar',
      height: '320px',
    },
  }),
  play: async ({ canvasElement, step }) => {
    await step('Dois PaneGroups renderizados (aninhado)', async () => {
      const groups = canvasElement.querySelectorAll('[data-slot="resizable-pane-group"]');
      await expect(groups.length).toBe(2);
    });
    await step('Dois handles (separators) presentes', async () => {
      const handles = canvasElement.querySelectorAll('[data-slot="resizable-handle"]');
      await expect(handles.length).toBe(2);
    });
  },
};
