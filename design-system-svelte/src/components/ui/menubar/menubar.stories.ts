import type { Meta, StoryObj } from '@storybook/svelte';
import { waitForPortal } from '@/lib/wait-for-portal';

import { userEvent, within, expect, waitFor } from 'storybook/test';
import MenubarStory from './MenubarStory.svelte';
import MenubarDocs from '@/components/docs/MenubarDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const meta = {
  title: 'UI/Menubar',
  component: MenubarStory,
  tags: ['autodocs', 'navigation'],
  parameters: {
    layout: 'centered',
    docs: {
      page: withAutoDocsTab(MenubarDocs),
      description: {
        component:
          'Menubar construído sobre bits-ui. Barra horizontal de menus estilo desktop com Triggers, Items, CheckboxItems, RadioItems, Submenus, Separators e Shortcuts; navegação por setas entre menus e foco coordenado via role=menubar.',
      },
    },
  },
  argTypes: {
    defaultValue: {
      control: 'text',
      description: 'Menu ativo inicial em modo não-controlado (ex: "file").',
    },
    loop: {
      control: 'boolean',
      description: 'Loop de navegação por setas entre Triggers.',
    },
    variant: {
      control: 'inline-radio',
      options: ['default', 'destructive'],
      description: 'Variante de Item exibida na demonstração default.',
    },
    demonstration: {
      control: 'select',
      options: ['default', 'shortcuts', 'submenu', 'checkbox', 'radio', 'itemDisabled', 'editor'],
      description: 'Composição interna usada na demonstração.',
    },
  },
  args: {
    defaultValue: undefined,
    loop: true,
    variant: 'default',
    demonstration: 'default',
  },
} satisfies Meta<typeof MenubarStory>;

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

    await step('1. Menubar Root tem role=menubar', async () => {
      const menubar = canvas.getByRole('menubar');
      await expect(menubar).toBeInTheDocument();
    });

    await step('2. Triggers têm aria-haspopup=menu', async () => {
      const trigger = canvas.getByRole('menuitem', { name: /Arquivo/i });
      await expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    });

    await step('3. Click no Trigger abre o menu (role=menu)', async () => {
      const trigger = canvas.getByRole('menuitem', { name: /Arquivo/i });
      await userEvent.click(trigger);
      const menu = await waitForPortal('menu');
      await expect(menu).toBeVisible();
    });

    await step('4. ESC fecha o menu', async () => {
      await userEvent.keyboard('{Escape}');
      await waitForClose();
    });
  },
};
