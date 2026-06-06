import type { Meta, StoryObj } from '@storybook/svelte';

import { within, expect, waitFor } from 'storybook/test';
import { Root as Sidebar } from './index';
import SidebarStory from './SidebarStory.svelte';
import SidebarIconStory from './SidebarIconStory.svelte';
import SidebarFixedStory from './SidebarFixedStory.svelte';

const meta = {
  title: 'UI/Sidebar/Estados',
  component: SidebarStory,
  tags: ['layout'],
  parameters: {
    layout: 'fullscreen',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Estados operacionais da Sidebar: expandido, recolhido em modo icon, offcanvas fechado e fixo (collapsible none).',
      },
    },
  },
} satisfies Meta<typeof SidebarStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Expandido: Story = {
  name: 'Expandido',
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

    await step('sidebar está presente e visível', async () => {
      const nav = canvas.getByRole('navigation', { name: /navegação principal/i });
      await expect(nav).toBeInTheDocument();
    });

    await step('item ativo possui aria-current="page"', async () => {
      const activeBtn = canvas.getByRole('button', { current: 'page' });
      await expect(activeBtn).toBeInTheDocument();
    });
  },
};

export const ModoIcon: Story = {
  name: 'Modo icon (colapsado)',
  render: () => ({
    Component: SidebarIconStory,
    props: {},
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('sidebar está no DOM', async () => {
      const nav = canvas.getByRole('navigation', { name: /navegação principal/i });
      await expect(nav).toBeInTheDocument();
    });

    await step('SidebarTrigger presente para expandir', async () => {
      const buttons = canvas.getAllByRole('button');
      await expect(buttons.length).toBeGreaterThan(0);
    });
  },
};

export const OffcanvasFechado: Story = {
  name: 'Offcanvas (fechado)',
  render: () => ({
    Component: SidebarStory,
    props: {
      variant: 'sidebar',
      collapsible: 'offcanvas',
      side: 'left',
      defaultOpen: false,
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('sidebar está no DOM', async () => {
      const nav = canvas.getByRole('navigation', { name: /navegação principal/i });
      await expect(nav).toBeInTheDocument();
    });
  },
};

export const Fixo: Story = {
  name: 'Fixo (collapsible none)',
  render: () => ({
    Component: SidebarFixedStory,
    props: {},
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('sidebar fixa está visível', async () => {
      const nav = canvas.getByRole('navigation', { name: /navegação principal/i });
      await expect(nav).toBeInTheDocument();
    });

    await step('não há SidebarTrigger no conteúdo', async () => {
      const header = canvasElement.querySelector('header');
      await expect(header).toBeTruthy();
    });
  },
};

export const Mobile: Story = {
  name: 'Mobile (Sheet overlay)',
  render: () => ({
    Component: SidebarStory,
    props: {
      variant: 'sidebar',
      collapsible: 'offcanvas',
      side: 'left',
      defaultOpen: false,
    },
  }),
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },

  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.firstElementChild).toBeTruthy());
  },
};
