import type { Meta, StoryObj } from '@storybook/svelte';

import { within, expect } from 'storybook/test';
import { Root as ContextMenu } from './index';
import ContextMenuEstadoStory from './ContextMenuEstadoStory.svelte';

const meta = {
  title: 'UI/ContextMenu/Estados',
  component: ContextMenu,
  tags: ['overlay'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      description: {
        component:
          'Estados do Context Menu: itens desabilitados e itens com inset para alinhamento.',
      },
    },
  },
} satisfies Meta<typeof ContextMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── Item Disabled ─────────────────────────────────────────────────────────────

export const ItemDisabled: Story = {
  name: 'Item Disabled',
  render: () => ({
    Component: ContextMenuEstadoStory,
    props: { estado: 'disabled' },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Trigger está visível', async () => {
      const trigger = canvasElement.querySelector('[data-slot="context-menu-trigger"]');
      await expect(trigger).toBeInTheDocument();
      await expect(trigger).toBeVisible();
    });

    await step('Trigger renderiza texto esperado', async () => {
      await expect(canvas.getByText(/clique com o bot/i)).toBeVisible();
    });
  },
};

// ── Item Inset ────────────────────────────────────────────────────────────────

export const ItemInset: Story = {
  name: 'Item Inset',
  render: () => ({
    Component: ContextMenuEstadoStory,
    props: { estado: 'inset' },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Trigger está visível', async () => {
      const trigger = canvasElement.querySelector('[data-slot="context-menu-trigger"]');
      await expect(trigger).toBeInTheDocument();
      await expect(trigger).toBeVisible();
    });

    await step('Trigger renderiza texto esperado', async () => {
      await expect(canvas.getByText(/clique com o bot/i)).toBeVisible();
    });
  },
};
