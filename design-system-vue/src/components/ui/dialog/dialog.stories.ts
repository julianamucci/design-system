import type { Meta, StoryObj } from '@storybook/vue3';
import { userEvent, within, expect, fn, waitFor } from 'storybook/test';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './index';
import { Button } from '@/components/ui/button';
import DialogDocs from '@/components/docs/DialogDocs.vue';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { waitForPortal } from '@/lib/wait-for-portal';

const meta = {
  title: 'UI/Dialog',
  component: Dialog,
  tags: ['autodocs', 'overlay'],
  parameters: {
    docs: { page: withAutoDocsTab(DialogDocs) },
  },
  argTypes: {
    defaultOpen: {
      control: 'boolean',
      description: 'Se o diálogo inicia aberto (útil para capturas visuais).',
    },
  },
  args: {
    defaultOpen: false,
  },
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => ({
    components: {
      Dialog,
      DialogClose,
      DialogContent,
      DialogDescription,
      DialogFooter,
      DialogHeader,
      DialogTitle,
      DialogTrigger,
      Button,
    },
    setup() {
      const onAction = fn();
      const onCancel = fn();
      return { args, onAction, onCancel };
    },
    template: `
      <Dialog :key="String(args.defaultOpen)" v-bind="args">
        <DialogTrigger as-child>
          <Button>Editar perfil</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar perfil</DialogTitle>
            <DialogDescription>
              Atualize suas informações pessoais. As mudanças são salvas ao confirmar.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose as-child>
              <Button variant="outline" @click="onCancel">Cancelar</Button>
            </DialogClose>
            <Button @click="onAction">Salvar alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);

    const waitForClose = async () => {
      await waitFor(() => {
        const dialog = body.queryByRole('dialog');
        if (dialog) throw new Error('dialog still open');
      }, { timeout: 800 });
    };

    await step('1. Abre ao clicar no trigger', async () => {
      const trigger = canvas.getByRole('button', { name: /Editar perfil/i });
      await expect(trigger).toBeInTheDocument();
      await userEvent.click(trigger);
      const dialog = await waitForPortal('dialog');
      await expect(dialog).toBeVisible();
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
