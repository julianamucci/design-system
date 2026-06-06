import type { Meta, StoryObj } from '@storybook/svelte';
import { waitForPortal } from '@/lib/wait-for-portal';

import { within, expect } from 'storybook/test';
import MenubarStory from './MenubarStory.svelte';

const meta = {
  title: 'UI/Menubar/Estados',
  component: MenubarStory,
  tags: ['navigation'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Estados canônicos do Menubar: fechado (apenas Triggers), aberto (defaultValue), item desabilitado e checkbox marcado.',
      },
    },
  },
} satisfies Meta<typeof MenubarStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Fechado: Story = {
  args: {
    defaultValue: undefined,
    demonstration: 'default',
  },
  parameters: {
    docs: {
      description: {
        story: 'Estado padrão — apenas a barra horizontal com Triggers; nenhum Content renderizado.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    const menubar = canvas.getByRole('menubar');
    await expect(menubar).toBeVisible();
    await expect(body.queryByRole('menu')).not.toBeInTheDocument();
  },
};

export const Aberto: Story = {
  args: {
    defaultValue: 'file',
    demonstration: 'default',
  },
  parameters: {
    docs: {
      description: {
        story: 'Menu Arquivo aberto via defaultValue="file". Captura visual no Chromatic.',
      },
    },
  },
  play: async () => {
    const body = within(document.body);
    const menu = await waitForPortal('menu');
    await expect(menu).toBeVisible();
  },
};

export const ItemDesabilitado: Story = {
  args: {
    defaultValue: 'file',
    demonstration: 'itemDisabled',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Item com prop disabled. data-disabled aplicado, aria-disabled=true e cursor not-allowed; teclado ignora item desabilitado.',
      },
    },
  },
  play: async () => {
    const body = within(document.body);
    const menu = await waitForPortal('menu');
    const disabledItem = menu.querySelector('[data-disabled]');
    await expect(disabledItem).not.toBeNull();
  },
};

export const CheckboxChecked: Story = {
  args: {
    defaultValue: 'view',
    demonstration: 'checkbox',
  },
  parameters: {
    docs: {
      description: {
        story:
          'CheckboxItem com data-state=checked exibindo o ícone Check e aria-checked=true.',
      },
    },
  },
  play: async () => {
    const body = within(document.body);
    const menu = await waitForPortal('menu');
    const checkboxes = within(menu).getAllByRole('menuitemcheckbox');
    const checked = checkboxes.find((c) => c.getAttribute('aria-checked') === 'true');
    await expect(checked).toBeTruthy();
  },
};
