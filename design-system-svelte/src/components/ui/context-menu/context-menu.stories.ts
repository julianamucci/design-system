import type { Meta, StoryObj } from '@storybook/svelte';

import { within, expect } from 'storybook/test';
import { Root as ContextMenu } from './index';
import ContextMenuStory from './ContextMenuStory.svelte';
import ContextMenuDocs from '@/components/docs/ContextMenuDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const meta = {
  title: 'UI/ContextMenu',
  component: ContextMenu,
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
} satisfies Meta<typeof ContextMenuStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => ({
    Component: ContextMenuStory,
    props: {
      triggerLabel: (args as any).triggerLabel ?? 'Clique com o botão direito aqui',
      showDestructive: (args as any).showDestructive ?? true,
      showShortcuts: (args as any).showShortcuts ?? true,
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
