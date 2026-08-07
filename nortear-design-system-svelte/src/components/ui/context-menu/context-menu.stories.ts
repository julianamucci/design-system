import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { within, expect } from 'storybook/test';
import ContextMenuStory from './ContextMenuStory.svelte';
import ContextMenuDocs from '@/components/docs/ContextMenuDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const meta: Meta = {
  title: 'UI/ContextMenu',
  component: ContextMenuStory,
  tags: ['autodocs', 'overlay'],
  parameters: {
    layout: 'centered',
    docs: { page: withAutoDocsTab(ContextMenuDocs) },
  },
  argTypes: {
    triggerLabel: {
      control: 'text',
      description: 'Texto exibido na área de trigger do menu',
    },
    showDestructive: {
      control: 'boolean',
      description: 'Exibe item destrutivo (Excluir)',
    },
    showShortcuts: {
      control: 'boolean',
      description: 'Exibe atalhos de teclado visuais nos itens',
    },
  },
  args: {
    triggerLabel: 'Clique com o botão direito aqui',
    showDestructive: true,
    showShortcuts: true,
  },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  render: (args) => ({
    Component: ContextMenuStory,
    props: {
      triggerLabel: args.triggerLabel ?? 'Clique com o botão direito aqui',
      showDestructive: args.showDestructive ?? true,
      showShortcuts: args.showShortcuts ?? true,
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Trigger do Context Menu está presente', async () => {
      const trigger = canvasElement.querySelector('[data-slot="context-menu-trigger"]');
      await expect(trigger).toBeInTheDocument();
    });

    await step('Trigger está visível', async () => {
      const trigger = canvasElement.querySelector('[data-slot="context-menu-trigger"]');
      await expect(trigger).toBeVisible();
    });

    await step('Texto do trigger é renderizado', async () => {
      await expect(canvas.getByText(/clique com o bot/i)).toBeVisible();
    });
  },
};
