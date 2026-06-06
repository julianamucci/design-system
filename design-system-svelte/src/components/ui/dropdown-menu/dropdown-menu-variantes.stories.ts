import type { Meta, StoryObj } from '@storybook/svelte';
import { waitForPortal } from '@/lib/wait-for-portal';

import { within, expect } from 'storybook/test';
import DropdownMenuStory from './DropdownMenuStory.svelte';

const meta = {
  title: 'UI/DropdownMenu/Variantes',
  component: DropdownMenuStory,
  tags: ['overlay'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Variantes do DropdownMenuItem: default (neutro) e destructive (ações irreversíveis). Renderizadas com defaultOpen=true para captura no Chromatic.',
      },
    },
  },
} satisfies Meta<typeof DropdownMenuStory>;

export default meta;
type Story = StoryObj<typeof meta>;

async function expectMenuOpen() {
  const body = within(document.body);
  const menu = await waitForPortal('menu');
  await expect(menu).toBeVisible();
  return menu;
}

export const Default: Story = {
  args: {
    defaultOpen: true,
    variant: 'default',
    triggerLabel: 'Mais ações',
  },
  parameters: {
    docs: {
      description: {
        story: 'Items neutros com hover bg-accent e foco visível.',
      },
    },
  },
  play: async () => {
    const menu = await expectMenuOpen();
    const items = within(menu).getAllByRole('menuitem');
    await expect(items.length).toBeGreaterThanOrEqual(3);
  },
};

export const Destructive: Story = {
  args: {
    defaultOpen: true,
    variant: 'destructive',
    triggerLabel: 'Ações da conta',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Item destructive com text-destructive e bg-destructive/10 no hover/focus. Reserve para ações irreversíveis.',
      },
    },
  },
  play: async () => {
    const menu = await expectMenuOpen();
    const destructive = menu.querySelector('[data-variant="destructive"]');
    await expect(destructive).not.toBeNull();
  },
};
