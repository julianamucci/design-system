import type { Meta, StoryObj } from '@storybook/svelte';
import { waitForPortal } from '@/lib/wait-for-portal';

import { within, expect, waitFor } from 'storybook/test';
import TooltipStory from './TooltipStory.svelte';

const meta = {
  title: 'UI/Tooltip/Variantes',
  component: TooltipStory,
  tags: ['overlay'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Variantes do Tooltip: default (texto curto), withShortcut (texto + kbd) e longText (até max-w-xs).',
      },
    },
  },
} satisfies Meta<typeof TooltipStory>;

export default meta;
type Story = StoryObj<typeof meta>;

const waitOpen = async () => {
  const body = within(document.body);
  await waitFor(
    async () => {
      const tip = await waitForPortal('tooltip');
      expect(tip).toBeVisible();
    },
    { timeout: 2000 }
  );
};

const baseArgs = {
  defaultOpen: true,
  delayDuration: 0,
  side: 'top' as const,
  align: 'center' as const,
  sideOffset: 4,
};

export const Default: Story = {
  name: 'Default',
  args: {
    ...baseArgs,
    variant: 'default',
    triggerLabel: 'Salvar',
    ariaLabel: 'Salvar',
    contentText: 'Salvar item',
  },
  play: async () => {
    await waitOpen();
    const body = within(document.body);
    await expect(body.getByText(/Salvar item/i)).toBeInTheDocument();
  },
};

export const WithShortcut: Story = {
  name: 'Com atalho (kbd)',
  args: {
    ...baseArgs,
    variant: 'withShortcut',
    triggerLabel: 'Salvar',
    ariaLabel: 'Salvar',
    contentText: 'Salvar',
  },
  play: async () => {
    await waitOpen();
    const body = within(document.body);
    await expect(body.getByText(/Ctrl/i)).toBeInTheDocument();
  },
};

export const LongText: Story = {
  name: 'Texto longo (max-w-xs)',
  args: {
    ...baseArgs,
    variant: 'longText',
    triggerLabel: 'Compartilhar',
    ariaLabel: 'Compartilhar link',
    contentText:
      'Compartilhe o link público desta página com qualquer pessoa — o conteúdo pode ser visualizado sem login.',
  },
  play: async () => {
    await waitOpen();
    const body = within(document.body);
    await expect(body.getByText(/Compartilhe o link público/i)).toBeInTheDocument();
  },
};
