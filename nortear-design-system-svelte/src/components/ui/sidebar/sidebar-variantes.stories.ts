import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { within, expect } from 'storybook/test';
import SidebarStory from './SidebarStory.svelte';

const meta: Meta = {
  title: 'UI/Sidebar/Variants',
  component: SidebarStory,
  tags: ['layout'],
  parameters: {
    layout: 'fullscreen',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Variantes visuais da Sidebar: sidebar (padrão), floating e inset. Cada variante altera o posicionamento e a aparência do container.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const VariantSidebar: Story = {
  name: 'sidebar (default)',
  render: () => ({
    Component: SidebarStory,
    props: {
      variant: 'sidebar',
      collapsible: 'offcanvas',
      side: 'left',
      defaultOpen: true,
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('sidebar variant="sidebar" está presente', async () => {
      const nav = canvas.getByRole('navigation', { name: /navegação principal/i });
      await expect(nav).toBeInTheDocument();
    });
  },
};

export const VariantFloating: Story = {
  name: 'floating',
  render: () => ({
    Component: SidebarStory,
    props: {
      variant: 'floating',
      collapsible: 'offcanvas',
      side: 'left',
      defaultOpen: true,
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('sidebar variant="floating" está presente', async () => {
      const nav = canvas.getByRole('navigation', { name: /navegação principal/i });
      await expect(nav).toBeInTheDocument();
    });
  },
};

export const VariantInset: Story = {
  name: 'inset',
  render: () => ({
    Component: SidebarStory,
    props: {
      variant: 'inset',
      collapsible: 'offcanvas',
      side: 'left',
      defaultOpen: true,
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('sidebar variant="inset" está presente', async () => {
      const nav = canvas.getByRole('navigation', { name: /navegação principal/i });
      await expect(nav).toBeInTheDocument();
    });
  },
};

export const SideRight: Story = {
  render: () => ({
    Component: SidebarStory,
    props: {
      variant: 'sidebar',
      collapsible: 'offcanvas',
      side: 'right',
      defaultOpen: true,
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('sidebar side="right" está presente', async () => {
      const nav = canvas.getByRole('navigation', { name: /navegação principal/i });
      await expect(nav).toBeInTheDocument();
    });
  },
};
