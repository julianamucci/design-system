import type { Meta, StoryObj } from '@storybook/svelte';
import { userEvent, within, expect, fn, waitFor } from 'storybook/test';
import { Dialog } from './index';
import DialogStory from './DialogStory.svelte';
import DialogDocs from '@/components/docs/DialogDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const meta = {
  title: 'UI/Dialog',
  component: Dialog,
  tags: ['autodocs'],
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

    await step('Trigger está presente no DOM', async () => {
      const trigger = canvas.getByRole('button', { name: /Editar perfil/i });
      await expect(trigger).toBeInTheDocument();
    });

    await step('Diálogo abre ao clicar no trigger', async () => {
      const trigger = canvas.getByRole('button', { name: /Editar perfil/i });
      await userEvent.click(trigger);
      const dialog = await body.findByRole('dialog');
      await expect(dialog).toBeVisible();
    });

    await step('Diálogo tem role dialog e é modal', async () => {
      const dialog = await body.findByRole('dialog');
      await expect(dialog).toHaveAttribute('role', 'dialog');
      await expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    await step('Título é acessível via aria-labelledby', async () => {
      const dialog = await body.findByRole('dialog');
      await expect(dialog).toHaveAccessibleName(/Editar perfil/i);
    });

    await step('Escape fecha o diálogo', async () => {
      await userEvent.keyboard('{Escape}');
      await waitFor(
        () => {
          const dialog = body.queryByRole('dialog');
          if (dialog && dialog.getAttribute('data-state') !== 'closed') {
            throw new Error('dialog still open');
          }
        },
        { timeout: 500 }
      );
    });
  },
};
