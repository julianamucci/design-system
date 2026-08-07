import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { within, expect } from 'storybook/test';
import { Root as ContextMenu } from './index';
import ContextMenuComposicaoStory from './ContextMenuComposicaoStory.svelte';

const meta: Meta = {
  title: 'UI/ContextMenu/Composicoes',
  component: ContextMenu,
  tags: ['overlay'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      description: {
        component:
          'Composicoes avançadas do Context Menu: checkbox, radio group, submenu e atalhos de teclado.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ── Com Shortcut ─────────────────────────────────────────────────────────────

export const ComShortcut: Story = {
  render: () => ({
    Component: ContextMenuComposicaoStory,
    props: { composition: 'shortcut' },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Trigger está visível', async () => {
      const trigger = canvasElement.querySelector('[data-slot="context-menu-trigger"]');
      await expect(trigger).toBeVisible();
    });

    await step('Texto do trigger é renderizado', async () => {
      await expect(canvas.getByText(/clique com o bot/i)).toBeVisible();
    });
  },
};

// ── Com Checkbox ─────────────────────────────────────────────────────────────

export const ComCheckbox: Story = {
  render: () => ({
    Component: ContextMenuComposicaoStory,
    props: { composition: 'checkbox' },
  }),
  play: async ({ canvasElement, step }) => {

    await step('Trigger está visível', async () => {
      const trigger = canvasElement.querySelector('[data-slot="context-menu-trigger"]');
      await expect(trigger).toBeVisible();
    });
  },
};

// ── Com Radio Group ───────────────────────────────────────────────────────────

export const ComRadioGroup: Story = {
  render: () => ({
    Component: ContextMenuComposicaoStory,
    props: { composition: 'radio' },
  }),
  play: async ({ canvasElement, step }) => {

    await step('Trigger está visível', async () => {
      const trigger = canvasElement.querySelector('[data-slot="context-menu-trigger"]');
      await expect(trigger).toBeVisible();
    });
  },
};

// ── Com Submenu ───────────────────────────────────────────────────────────────

export const ComSubmenu: Story = {
  render: () => ({
    Component: ContextMenuComposicaoStory,
    props: { composition: 'submenu' },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Trigger está visível', async () => {
      const trigger = canvasElement.querySelector('[data-slot="context-menu-trigger"]');
      await expect(trigger).toBeVisible();
    });

    await step('Texto do trigger é renderizado', async () => {
      await expect(canvas.getByText(/clique com o bot/i)).toBeVisible();
    });
  },
};
