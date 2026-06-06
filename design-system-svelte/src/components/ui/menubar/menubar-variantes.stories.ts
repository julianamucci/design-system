import type { Meta, StoryObj } from '@storybook/svelte';
import { waitForPortal } from '@/lib/wait-for-portal';

import { within, expect } from 'storybook/test';
import MenubarStory from './MenubarStory.svelte';

const meta = {
  title: 'UI/Menubar/Variantes',
  component: MenubarStory,
  tags: ['navigation'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Variantes de MenubarItem: default (neutro com bg-accent no hover) e destructive (text-destructive + bg-destructive/10). Renderizadas com defaultValue para abrir o menu e capturar no Chromatic.',
      },
    },
  },
} satisfies Meta<typeof MenubarStory>;

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
    defaultValue: 'file',
    variant: 'default',
    demonstration: 'default',
  },
  parameters: {
    docs: {
      description: {
        story: 'Item neutro com hover bg-accent. Padrão para a maioria das ações.',
      },
    },
  },
  play: async () => {
    const menu = await expectMenuOpen();
    const items = within(menu).getAllByRole('menuitem');
    await expect(items.length).toBeGreaterThanOrEqual(2);
  },
};

export const Destructive: Story = {
  args: {
    defaultValue: 'file',
    variant: 'destructive',
    demonstration: 'default',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Item destructive com text-destructive e bg-destructive/10 no hover/focus. Reserve para ações irreversíveis (excluir, descartar).',
      },
    },
  },
  play: async () => {
    const menu = await expectMenuOpen();
    const destructive = menu.querySelector('[data-variant="destructive"]');
    await expect(destructive).not.toBeNull();
  },
};
