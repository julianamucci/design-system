import type { Meta, StoryObj } from '@storybook/vue3';
import { userEvent, within, expect, fn } from 'storybook/test';
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

const meta = {
  title: 'UI/Dialog',
  component: Dialog,
  tags: ['autodocs'],
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

    await step('Diálogo tem título acessível', async () => {
      const dialog = await body.findByRole('dialog');
      await expect(dialog).toHaveAccessibleName(/Editar perfil/i);
    });

    await step('Escape fecha o diálogo', async () => {
      await userEvent.keyboard('{Escape}');
      await expect(body.queryByRole('dialog')).not.toBeInTheDocument();
    });
  },
};
