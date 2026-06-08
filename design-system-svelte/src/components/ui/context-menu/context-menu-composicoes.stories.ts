import type { Meta, StoryObj } from '@storybook/svelte';

import { within, expect } from 'storybook/test';
import { Root as ContextMenu } from './index';
import ContextMenuComposicaoStory from './ContextMenuComposicaoStory.svelte';

const meta = {
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
} satisfies Meta<typeof ContextMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── Com Shortcut ─────────────────────────────────────────────────────────────

export const ComShortcut: Story = {
  name: 'Com Shortcut',
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
  name: 'Com Checkbox',
  render: () => ({
    Component: ContextMenuComposicaoStory,
    props: { composition: 'checkbox' },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Trigger está visível', async () => {
      const trigger = canvasElement.querySelector('[data-slot="context-menu-trigger"]');
      await expect(trigger).toBeVisible();
    });
  },
};

// ── Com Radio Group ───────────────────────────────────────────────────────────

export const ComRadioGroup: Story = {
  name: 'Com Radio Group',
  render: () => ({
    Component: ContextMenuComposicaoStory,
    props: { composition: 'radio' },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Trigger está visível', async () => {
      const trigger = canvasElement.querySelector('[data-slot="context-menu-trigger"]');
      await expect(trigger).toBeVisible();
    });
  },
};

// ── Com Submenu ───────────────────────────────────────────────────────────────

export const ComSubmenu: Story = {
  name: 'Com Submenu',
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
