import type { Meta, StoryObj } from '@storybook/svelte';
import { waitForPortal } from '@/lib/wait-for-portal';

import { userEvent, within, expect, waitFor } from 'storybook/test';
import HoverCardStory from './HoverCardStory.svelte';

const meta = {
  title: 'UI/HoverCard/Estados',
  component: HoverCardStory,
  tags: ['overlay'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Estados do HoverCard: fechado (apenas trigger), aberto (Content visível) e controlado (open + onOpenChange externo).',
      },
    },
  },
} satisfies Meta<typeof HoverCardStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Fechado: Story = {
  name: 'Fechado',
  args: {
    defaultOpen: false,
    openDelay: 700,
    closeDelay: 300,
    variant: 'userProfile',
    triggerLabel: '@joana',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);

    const trigger = canvas.getByRole('link', { name: /@joana/i });
    await expect(trigger).toBeInTheDocument();
    await expect(body.queryByRole('dialog')).not.toBeInTheDocument();
  },
};

export const Aberto: Story = {
  name: 'Aberto (defaultOpen)',
  args: {
    defaultOpen: true,
    openDelay: 0,
    closeDelay: 0,
    variant: 'userProfile',
    triggerLabel: '@joana',
  },
  play: async ({ canvasElement }) => {
    const body = within(document.body);
    const dialog = await waitForPortal('dialog', { timeout: 2000 });
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('data-state', 'open');
  },
};

export const Controlado: Story = {
  name: 'Controlado (open prop)',
  args: {
    open: true,
    openDelay: 0,
    closeDelay: 0,
    variant: 'userProfile',
    triggerLabel: '@joana',
  },
  play: async ({ canvasElement }) => {
    const body = within(document.body);
    const dialog = await waitForPortal('dialog', { timeout: 2000 });
    await expect(dialog).toBeVisible();

    await userEvent.keyboard('{Escape}');
    await waitFor(
      () => {
        const d = body.queryByRole('dialog');
        if (d && d.getAttribute('data-state') !== 'closed') {
          throw new Error('still open');
        }
      },
      { timeout: 2000 }
    );
  },
};
