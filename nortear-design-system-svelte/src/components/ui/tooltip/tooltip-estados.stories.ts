import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { waitForPortal } from '@/lib/wait-for-portal';

import { userEvent, within, expect, waitFor } from 'storybook/test';
import TooltipStory from './TooltipStory.svelte';

const meta: Meta = {
  title: 'UI/Tooltip/States',
  component: TooltipStory,
  tags: ['overlay'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Estados do Tooltip: fechado (apenas trigger), aberto (defaultOpen), foco via teclado (sem delay) e controlado (open + onOpenChange).',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

const waitForClose = async () => {
  const body = within(document.body);
  await waitFor(
    () => {
      const tip = body.queryByRole('tooltip');
      if (tip && tip.getAttribute('data-state') !== 'closed') {
        throw new Error('still open');
      }
    },
    { timeout: 2000 }
  );
};

export const Closed: Story = {
  args: {
    defaultOpen: false,
    delayDuration: 200,
    variant: 'default',
    triggerLabel: 'Salvar',
    ariaLabel: 'Salvar',
    contentText: 'Salvar (Ctrl+S)',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);

    const trigger = canvas.getByRole('button', { name: /salvar/i });
    await expect(trigger).toBeInTheDocument();
    await expect(body.queryByRole('tooltip')).not.toBeInTheDocument();
  },
};

export const Open: Story = {
  name: 'Open (defaultOpen)',
  args: {
    defaultOpen: true,
    delayDuration: 0,
    variant: 'default',
    triggerLabel: 'Salvar',
    ariaLabel: 'Salvar',
    contentText: 'Salvar (Ctrl+S)',
  },
  play: async () => {
    const tip = await waitForPortal('tooltip', { timeout: 2000 });
    await expect(tip).toBeVisible();
  },
};

export const KeyboardFocus: Story = {
  name: 'Keyboard focus (no delay)',
  args: {
    defaultOpen: false,
    delayDuration: 0,
    variant: 'default',
    triggerLabel: 'Salvar',
    ariaLabel: 'Salvar',
    contentText: 'Salvar (Ctrl+S)',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: /salvar/i });
    trigger.focus();
    const tip = await waitForPortal('tooltip', { timeout: 1500 });
    await expect(tip).toBeVisible();
  },
};

export const Controlled: Story = {
  name: 'Controlled (open prop)',
  args: {
    open: true,
    delayDuration: 0,
    variant: 'default',
    triggerLabel: 'Salvar',
    ariaLabel: 'Salvar',
    contentText: 'Salvar (Ctrl+S)',
  },
  play: async () => {
    const tip = await waitForPortal('tooltip', { timeout: 2000 });
    await expect(tip).toBeVisible();

    await userEvent.keyboard('{Escape}');
    await waitForClose();
  },
};
