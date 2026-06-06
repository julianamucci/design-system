import type { Meta, StoryObj } from '@storybook/svelte';

import { userEvent, within, expect } from 'storybook/test';
import { Root as Sidebar } from './index';
import SidebarStory from './SidebarStory.svelte';
import SidebarDocs from '@/components/docs/SidebarDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const meta = {
  title: 'UI/Sidebar',
  component: Sidebar,
  tags: ['autodocs', 'layout'],
  parameters: {
    layout: 'fullscreen',
    docs: { page: withAutoDocsTab(SidebarDocs) },
  },
  argTypes: {
    side: {
      control: 'select',
      options: ['left', 'right'],
      description: 'Posição da sidebar',
    },
    variant: {
      control: 'select',
      options: ['sidebar', 'floating', 'inset'],
      description: 'Estilo visual da sidebar',
    },
    collapsible: {
      control: 'select',
      options: ['offcanvas', 'icon', 'none'],
      description: 'Comportamento ao recolher',
    },
  },
  args: {
    side: 'left',
    variant: 'sidebar',
    collapsible: 'offcanvas',
  },
} satisfies Meta<typeof Sidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => ({
    Component: SidebarStory,
    props: {
      side: args.side,
      variant: args.variant,
      collapsible: args.collapsible,
      defaultOpen: true,
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('sidebar está presente no DOM', async () => {
      const nav = canvas.getByRole('navigation', { name: /navegação principal/i });
      await expect(nav).toBeInTheDocument();
    });

    await step('SidebarTrigger está presente', async () => {
      const triggers = canvas.getAllByRole('button');
      await expect(triggers.length).toBeGreaterThan(0);
    });

    await step('item ativo tem aria-current="page"', async () => {
      const activeButton = canvas.getByRole('button', { current: 'page' });
      await expect(activeButton).toBeInTheDocument();
    });

    await step('clicar no SidebarTrigger alterna a sidebar', async () => {
      const trigger = canvasElement.querySelector('[data-sidebar="trigger"]') as HTMLElement;
      if (trigger) {
        await userEvent.click(trigger);
      }
    });
  },
};
