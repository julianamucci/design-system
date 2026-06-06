import type { Meta, StoryObj } from '@storybook/svelte';
import { waitForPortal } from '@/lib/wait-for-portal';

import { userEvent, within, expect, waitFor } from 'storybook/test';
import DropdownMenuStory from './DropdownMenuStory.svelte';
import DropdownMenuDocs from '@/components/docs/DropdownMenuDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const meta = {
  title: 'UI/DropdownMenu',
  component: DropdownMenuStory,
  tags: ['autodocs', 'overlay'],
  parameters: {
    layout: 'centered',
    docs: {
      page: withAutoDocsTab(DropdownMenuDocs),
      description: {
        component:
          'DropdownMenu construído sobre bits-ui. Menu suspenso com items, checkbox-items, radio-group, submenus, separators e shortcuts em popup acessível com role=menu, focus trap e navegação por teclado.',
      },
    },
  },
  argTypes: {
    side: {
      control: 'inline-radio',
      options: ['top', 'bottom', 'left', 'right'],
      description: 'Lado de abertura do Content.',
    },
    align: {
      control: 'inline-radio',
      options: ['start', 'center', 'end'],
      description: 'Alinhamento horizontal do Content.',
    },
    modal: {
      control: 'boolean',
      description: 'Quando true, bloqueia interação com o resto da página.',
    },
    defaultOpen: {
      control: 'boolean',
      description: 'Estado inicial em modo não-controlado.',
    },
    triggerLabel: {
      control: 'text',
      description: 'Texto exibido no botão que abre o menu.',
    },
    variant: {
      control: 'select',
      options: [
        'default',
        'destructive',
        'withLabel',
        'withCheckbox',
        'withRadio',
        'withSubmenu',
        'withShortcuts',
        'itemDisabled',
      ],
      description: 'Composição interna usada na demonstração.',
    },
  },
  args: {
    side: 'bottom',
    align: 'start',
    modal: true,
    defaultOpen: false,
    triggerLabel: 'Mais ações',
    variant: 'default',
  },
} satisfies Meta<typeof DropdownMenuStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);

    const waitForClose = async () => {
      await waitFor(
        () => {
          const menu = body.queryByRole('menu');
          if (menu && menu.getAttribute('data-state') !== 'closed') {
            throw new Error('menu still open');
          }
        },
        { timeout: 1500 }
      );
    };

    await step('1. Trigger renderiza com aria-haspopup=menu', async () => {
      const trigger = canvas.getByRole('button', { name: /Mais ações/i });
      await expect(trigger).toBeInTheDocument();
      await expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    });

    await step('2. Click abre o menu (role=menu)', async () => {
      const trigger = canvas.getByRole('button', { name: /Mais ações/i });
      await userEvent.click(trigger);
      const menu = await waitForPortal('menu');
      await expect(menu).toBeVisible();
    });

    await step('3. Items têm role=menuitem', async () => {
      const items = await body.findAllByRole('menuitem');
      await expect(items.length).toBeGreaterThan(0);
    });

    await step('4. ESC fecha o menu', async () => {
      await userEvent.keyboard('{Escape}');
      await waitForClose();
    });
  },
};
