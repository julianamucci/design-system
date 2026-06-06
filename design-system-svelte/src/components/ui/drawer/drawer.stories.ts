import type { Meta, StoryObj } from '@storybook/svelte';
import { waitForPortal } from '@/lib/wait-for-portal';

import { userEvent, within, expect, waitFor, fn } from 'storybook/test';
import DrawerStory from './DrawerStory.svelte';
import DrawerDocs from '@/components/docs/DrawerDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const meta = {
  title: 'UI/Drawer',
  component: DrawerStory,
  tags: ['autodocs', 'disclosure'],
  parameters: {
    layout: 'centered',
    docs: {
      page: withAutoDocsTab(DrawerDocs),
      description: {
        component:
          'Drawer mobile-first construído sobre vaul-svelte. Painel deslizante com 4 direções, focus trap, ESC para fechar e gestos de swipe.',
      },
    },
  },
  argTypes: {
    direction: {
      control: 'inline-radio',
      options: ['bottom', 'top', 'left', 'right'],
      description: 'Direção de entrada do painel.',
    },
    defaultOpen: {
      control: 'boolean',
      description: 'Estado inicial em modo não-controlado.',
    },
    dismissible: {
      control: 'boolean',
      description: 'Permite fechar via swipe, ESC ou clique no overlay.',
    },
  },
  args: {
    direction: 'bottom',
    defaultOpen: false,
    dismissible: true,
    triggerLabel: 'Abrir drawer',
    title: 'Editar perfil',
    description: 'Atualize seus dados pessoais e foto.',
    actionLabel: 'Confirmar',
    cancelLabel: 'Cancelar',
    onAction: fn(),
    onCancel: fn(),
  },
} satisfies Meta<typeof DrawerStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);

    const waitForClose = async () => {
      await waitFor(
        () => {
          const dialog = body.queryByRole('dialog');
          if (dialog && dialog.getAttribute('data-state') !== 'closed') {
            throw new Error('drawer still open');
          }
        },
        { timeout: 1200 }
      );
    };

    await step('1. Abre ao clicar no trigger', async () => {
      const trigger = canvas.getByRole('button', { name: /Abrir drawer/i });
      await expect(trigger).toBeInTheDocument();
      await userEvent.click(trigger);
      const dialog = await waitForPortal('dialog');
      await expect(dialog).toBeVisible();
      await expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    await step('2. Aplica data-vaul-drawer-direction=bottom', async () => {
      const dialog = await waitForPortal('dialog');
      await expect(dialog).toHaveAttribute('data-vaul-drawer-direction', 'bottom');
    });

    await step('3. Foco move para dentro do drawer (focus trap)', async () => {
      const dialog = await waitForPortal('dialog');
      await waitFor(() => {
        if (!dialog.contains(document.activeElement)) throw new Error('focus not trapped');
      });
    });

    await step('4. ESC fecha o drawer', async () => {
      await userEvent.keyboard('{Escape}');
      await waitForClose();
    });
  },
};
