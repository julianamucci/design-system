import type { Meta, StoryObj } from '@storybook/svelte';
import { waitForPortal } from '@/lib/wait-for-portal';

import { userEvent, within, expect, waitFor } from 'storybook/test';
import TooltipStory from './TooltipStory.svelte';

const meta = {
  title: 'UI/Tooltip/Estados',
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
} satisfies Meta<typeof TooltipStory>;

export default meta;
type Story = StoryObj<typeof meta>;

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

export const Fechado: Story = {
  name: 'Fechado',
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

export const Aberto: Story = {
  name: 'Aberto (defaultOpen)',
  args: {
    defaultOpen: true,
    delayDuration: 0,
    variant: 'default',
    triggerLabel: 'Salvar',
    ariaLabel: 'Salvar',
    contentText: 'Salvar (Ctrl+S)',
  },
  play: async () => {
    const body = within(document.body);
    const tip = await waitForPortal('tooltip', { timeout: 2000 });
    await expect(tip).toBeVisible();
  },
};

export const FocoTeclado: Story = {
  name: 'Foco via teclado (sem delay)',
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
    const body = within(document.body);
    const trigger = canvas.getByRole('button', { name: /salvar/i });
    trigger.focus();
    const tip = await waitForPortal('tooltip', { timeout: 1500 });
    await expect(tip).toBeVisible();
  },
};

export const Controlado: Story = {
  name: 'Controlado (open prop)',
  args: {
    open: true,
    delayDuration: 0,
    variant: 'default',
    triggerLabel: 'Salvar',
    ariaLabel: 'Salvar',
    contentText: 'Salvar (Ctrl+S)',
  },
  play: async () => {
    const body = within(document.body);
    const tip = await waitForPortal('tooltip', { timeout: 2000 });
    await expect(tip).toBeVisible();

    await userEvent.keyboard('{Escape}');
    await waitForClose();
  },
};
