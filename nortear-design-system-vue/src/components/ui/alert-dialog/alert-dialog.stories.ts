import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, userEvent, expect, fn, waitFor } from 'storybook/test';
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
    // Guardado como nó: com o diálogo aberto o conteúdo externo recebe
    // aria-hidden/inert, então uma nova query por role não o encontraria.
    const trigger = canvas.getByRole('button', { name: /Excluir conta/i });

    await step('Trigger está presente no DOM', async () => {
      await expect(trigger).toBeInTheDocument();
    });

    await step('Diálogo abre ao clicar no trigger, com role alertdialog', async () => {
      await userEvent.click(trigger);
      const dialog = await body.findByRole('alertdialog');
      // A entrada do painel é animada (opacidade 0 → 1). Sem waitFor a asserção
      // roda no primeiro quadro e reprova um elemento que ainda vai aparecer.
      await waitFor(() => expect(dialog).toBeVisible());
      await expect(dialog).toHaveAttribute('role', 'alertdialog');
    });

    await step('Foco inicial vai para o AlertDialogCancel', async () => {
      const dialog = await body.findByRole('alertdialog');
      const cancel = within(dialog).getByRole('button', { name: /Cancelar/i });
      await waitFor(() => expect(cancel).toHaveFocus());
    });

    await step('aria-labelledby aponta para o AlertDialogTitle', async () => {
      const dialog = await body.findByRole('alertdialog');
      await expect(dialog).toHaveAccessibleName(/Excluir sua conta/i);
      const labelledBy = dialog.getAttribute('aria-labelledby');
      await expect(document.getElementById(labelledBy ?? '')).toHaveTextContent(
        /Excluir sua conta\?/i,
      );
    });

    await step('aria-describedby aponta para a AlertDialogDescription', async () => {
      const dialog = await body.findByRole('alertdialog');
      const describedBy = dialog.getAttribute('aria-describedby');
      await expect(document.getElementById(describedBy ?? '')).toHaveTextContent(
        /Essa ação é permanente/i,
      );
    });

    await step('Tab e Shift+Tab circulam apenas dentro do diálogo', async () => {
      const dialog = await body.findByRole('alertdialog');
      const cancel = within(dialog).getByRole('button', { name: /Cancelar/i });
      const action = within(dialog).getByRole('button', { name: /Excluir conta/i });

      await userEvent.tab();
      await expect(action).toHaveFocus();

      await userEvent.tab({ shift: true });
      await expect(cancel).toHaveFocus();

      // Focus trap: por mais que se avance, o foco nunca sai do diálogo.
      await userEvent.tab();
      await userEvent.tab();
      await expect(dialog).toContainElement(document.activeElement as HTMLElement);
    });

    await step('Escape fecha o diálogo e devolve o foco ao trigger', async () => {
      await userEvent.keyboard('{Escape}');
      await waitFor(() =>
        expect(body.queryByRole('alertdialog')).not.toBeInTheDocument(),
      );
      await waitFor(() => expect(trigger).toHaveFocus());
    });
  },
};
