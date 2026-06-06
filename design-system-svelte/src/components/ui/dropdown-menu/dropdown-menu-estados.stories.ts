import type { Meta, StoryObj } from '@storybook/svelte';
import { waitForPortal } from '@/lib/wait-for-portal';

import { userEvent, within, expect, waitFor } from 'storybook/test';
import DropdownMenuStory from './DropdownMenuStory.svelte';

const meta = {
  title: 'UI/DropdownMenu/Estados',
  component: DropdownMenuStory,
  tags: ['overlay'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Estados canônicos do DropdownMenu: fechado, aberto (defaultOpen), controlado externamente e item desabilitado.',
      },
    },
  },
} satisfies Meta<typeof DropdownMenuStory>;

export default meta;
type Story = StoryObj<typeof meta>;

async function waitForClose() {
  const body = within(document.body);
  await waitFor(
    () => {
      const menu = body.queryByRole('menu');
      if (menu && menu.getAttribute('data-state') !== 'closed') {
        throw new Error('menu still open');
      }
    },
    { timeout: 1500 }
  );
}

export const Fechado: Story = {
  args: {
    defaultOpen: false,
    variant: 'default',
    triggerLabel: 'Mais ações',
  },
  parameters: {
    docs: {
      description: {
        story: 'Estado padrão — apenas o trigger renderizado; portal vazio.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    const trigger = canvas.getByRole('button', { name: /Mais ações/i });
    await expect(trigger).toBeVisible();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(body.queryByRole('menu')).not.toBeInTheDocument();
  },
};

export const Aberto: Story = {
  args: {
    defaultOpen: true,
    variant: 'withLabel',
    triggerLabel: 'Conta',
  },
  parameters: {
    docs: {
      description: {
        story: 'Menu aberto via defaultOpen=true. Captura visual no Chromatic.',
      },
    },
  },
  play: async () => {
    const body = within(document.body);
    const menu = await waitForPortal('menu');
    await expect(menu).toBeVisible();
  },
};

export const Controlado: Story = {
  args: {
    open: false,
    variant: 'default',
    triggerLabel: 'Abrir via estado externo',
  },
  parameters: {
    docs: {
      description: {
        story: 'Abertura controlada via open + onOpenChange (bind:open).',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);

    await step('Click no trigger abre menu controlado', async () => {
      const trigger = canvas.getByRole('button', { name: /Abrir via estado externo/i });
      await userEvent.click(trigger);
      const menu = await waitForPortal('menu');
      await expect(menu).toBeVisible();
    });

    await step('ESC fecha o menu controlado', async () => {
      await userEvent.keyboard('{Escape}');
      await waitForClose();
    });
  },
};

export const ItemDesabilitado: Story = {
  args: {
    defaultOpen: true,
    variant: 'itemDisabled',
    triggerLabel: 'Ações',
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
