import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { waitForPortal } from '@/lib/wait-for-portal';

import { expect, waitFor } from 'storybook/test';
import HoverCardStory from './HoverCardStory.svelte';

const meta: Meta = {
  title: 'UI/HoverCard/Variantes',
  component: HoverCardStory,
  tags: ['overlay'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Variantes do HoverCard: configuração de delay padrão da lib (700/300ms) e delay curto para previews ricos.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

const waitForOpen = async (_root: HTMLElement) => {
  await waitFor(
    async () => {
      const dialog = await waitForPortal('dialog');
      expect(dialog).toBeInTheDocument();
    },
    { timeout: 2000 }
  );
};

export const Default: Story = {
  name: 'Default (700ms / 300ms)',
  args: {
    openDelay: 0,
    closeDelay: 0,
    defaultOpen: true,
    variant: 'userProfile',
    triggerLabel: '@joana',
  },
  play: async ({ canvasElement }) => {
    await waitForOpen(canvasElement);
    const dialog = await waitForPortal('dialog');
    await expect(dialog).toHaveAttribute('data-state', 'open');
  },
};

export const ComDelayCurto: Story = {
  name: 'Com delay curto (50ms)',
  args: {
    openDelay: 0,
    closeDelay: 0,
    defaultOpen: true,
    variant: 'userProfile',
    triggerLabel: '@joana',
  },
  play: async ({ canvasElement }) => {
    await waitForOpen(canvasElement);
    const dialog = await waitForPortal('dialog');
    await expect(dialog).toBeVisible();
  },
};
