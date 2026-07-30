import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, userEvent, expect, fn } from 'storybook/test';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './index';
import { Button } from '@/components/ui/button';
import AlertDialogDocs from '@/components/docs/AlertDialogDocs.vue';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const meta = {
  title: 'UI/AlertDialog',
  component: AlertDialog,
  tags: ['autodocs', 'overlay'],
  parameters: {
    docs: { page: withAutoDocsTab(AlertDialogDocs) },
  },
  // A aba "API Reference" combina o docgen com estes argTypes. Props que o
  // template não encaminha ficam como documentação (control: false).
  argTypes: {
    defaultOpen: {
      control: 'boolean',
      description: 'Estado inicial em modo não controlado. Útil para capturas visuais.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    unmountOnHide: {
      control: 'boolean',
      description: 'Desmonta o conteúdo ao fechar. Desligue para manter o painel no DOM.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    open: {
      control: false,
      description: 'Estado controlado de abertura, via v-model:open.',
      table: { type: { summary: 'boolean' } },
    },
    'onUpdate:open': {
      control: false,
      description: 'Emitido ao abrir ou fechar. Recebe o novo estado.',
      table: { type: { summary: '(open: boolean) => void' } },
    },
    default: {
      control: false,
      description: 'Slot de composição: Trigger, Content, Header, Footer, Cancel e Action.',
      table: { type: { summary: 'slot' } },
    },
  },
  args: {
    defaultOpen: false,
    unmountOnHide: true,
  },
} satisfies Meta<typeof AlertDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => ({
    components: {
      AlertDialog,
      AlertDialogAction,
      AlertDialogCancel,
      AlertDialogContent,
      AlertDialogDescription,
      AlertDialogFooter,
      AlertDialogHeader,
      AlertDialogTitle,
      AlertDialogTrigger,
      Button,
    },
    setup() {
      const onConfirm = fn();
      const onCancel = fn();
      return { args, onConfirm, onCancel };
    },
    template: `
      <AlertDialog v-bind="args">
        <AlertDialogTrigger as-child>
          <Button variant="destructive">Excluir conta</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir sua conta?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação é permanente. Todos os dados, arquivos e histórico serão removidos e não poderão ser recuperados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel @click="onCancel">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              @click="onConfirm"
            >
              Excluir conta
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);

    await step('Trigger está presente no DOM', async () => {
      const trigger = canvas.getByRole('button', { name: /Excluir conta/i });
      await expect(trigger).toBeInTheDocument();
    });

    await step('Diálogo abre ao clicar no trigger', async () => {
      const trigger = canvas.getByRole('button', { name: /Excluir conta/i });
      await userEvent.click(trigger);
      const dialog = await body.findByRole('alertdialog');
      await expect(dialog).toBeVisible();
    });

    await step('Diálogo tem role alertdialog', async () => {
      const dialog = await body.findByRole('alertdialog');
      await expect(dialog).toHaveAttribute('role', 'alertdialog');
    });

    await step('Título e descrição são acessíveis', async () => {
      const dialog = await body.findByRole('alertdialog');
      await expect(dialog).toHaveAccessibleName(/Excluir sua conta/i);
    });

    await step('Escape fecha o diálogo', async () => {
      await userEvent.keyboard('{Escape}');
      await expect(body.queryByRole('alertdialog')).not.toBeInTheDocument();
    });
  },
};
