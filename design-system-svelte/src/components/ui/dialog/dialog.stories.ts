import type { Meta, StoryObj } from '@storybook/svelte';
import { waitForPortal } from '@/lib/wait-for-portal';

import { userEvent, within, expect, waitFor, fn } from 'storybook/test';
import { Dialog } from './index';
import DialogStory from './DialogStory.svelte';
import DialogDocs from '@/components/docs/DialogDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const meta = {
  title: 'UI/Dialog',
  component: Dialog,
  tags: ['autodocs', 'overlay'],
  parameters: {
    docs: { page: withAutoDocsTab(DialogDocs) },
  },
  argTypes: {
    open: {
      control: 'boolean',
      description: 'Estado controlado de abertura. Útil para capturas visuais.',
    },
  },
  args: {
    open: false,
  },
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => ({
    Component: DialogStory,
    props: {
      open: args.open,
      variant: 'default',
      onAction: fn(),
      onCancel: fn(),
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);

    const waitForClose = async () => {
      await waitFor(() => {
        const dialog = body.queryByRole('dialog');
        if (dialog && dialog.getAttribute('data-state') !== 'closed') {
          throw new Error('dialog still open');
        }
      }, { timeout: 800 });
    };

    await step('1. Abre ao clicar no trigger', async () => {
      const trigger = canvas.getByRole('button', { name: /Editar perfil/i });
      await expect(trigger).toBeInTheDocument();
      await userEvent.click(trigger);
      const dialog = await waitForPortal('dialog');
      await expect(dialog).toBeVisible();
      await expect(dialog).toHaveAttribute('aria-modal', 'true');
      await expect(dialog).toHaveAccessibleName(/Editar perfil/i);
    });

    await step('5. Focus trap — foco move para dentro do dialog', async () => {
      const dialog = await waitForPortal('dialog');
      await waitFor(() => {
        if (!dialog.contains(document.activeElement)) throw new Error('focus not trapped');
      });
    });

    await step('2. Escape fecha o diálogo', async () => {
      await userEvent.keyboard('{Escape}');
      await waitForClose();
    });

    await step('6. Retorno de foco ao trigger após Escape', async () => {
      await waitFor(() => {
        const trigger = canvas.getByRole('button', { name: /Editar perfil/i });
        if (document.activeElement !== trigger) throw new Error('focus did not return');
      });
    });

    await step('3. Reabrir e fechar via clique no overlay', async () => {
      const trigger = canvas.getByRole('button', { name: /Editar perfil/i });
      await userEvent.click(trigger);
      await waitForPortal('dialog');
      const overlay = document.querySelector<HTMLElement>('[data-slot="dialog-overlay"]');
      await expect(overlay).not.toBeNull();
      overlay?.click();
      await waitForClose();
    });

    await step('4. Reabrir e fechar via botão Close (X)', async () => {
      const trigger = canvas.getByRole('button', { name: /Editar perfil/i });
      await userEvent.click(trigger);
      const dialog = await waitForPortal('dialog');
      const closeBtn = within(dialog).getByRole('button', { name: /close/i });
      await userEvent.click(closeBtn);
      await waitForClose();
    });

    await step('7. Uncontrolled — fluxo via Cancel sem prop open', async () => {
      const trigger = canvas.getByRole('button', { name: /Editar perfil/i });
      await userEvent.click(trigger);
      const dialog = await waitForPortal('dialog');
      const cancel = within(dialog).getByRole('button', { name: /Cancelar/i });
      await userEvent.click(cancel);
      await waitForClose();
    });
  },
};
