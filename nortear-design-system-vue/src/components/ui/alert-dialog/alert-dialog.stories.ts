import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, userEvent, expect, fn, waitFor } from 'storybook/test';
import { waitForPortal, waitForPortalGone } from '@/lib/wait-for-portal';
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

// Spies em escopo de módulo: a story renderiza uma vez por execução e o play
// precisa inspecioná-los. São limpos no início do play, antes de qualquer ação.
const onOpenChange = fn();
const onConfirm = fn();
const onCancel = fn();

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
      return { args, onOpenChange, onConfirm, onCancel };
    },
    template: `
      <AlertDialog v-bind="args" @update:open="onOpenChange">
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
    // Guardado como nó: com o diálogo aberto o conteúdo externo recebe
    // aria-hidden/inert, então uma nova query por role não o encontraria.
    const trigger = canvas.getByRole('button', { name: /Excluir conta/i });
    const openedWith = (open: boolean) =>
      onOpenChange.mock.calls.some((call) => call[0] === open);

    onOpenChange.mockClear();
    onConfirm.mockClear();
    onCancel.mockClear();

    await step('Trigger está presente e anuncia que abre um diálogo', async () => {
      await expect(trigger).toBeInTheDocument();
      await expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    await step('Diálogo abre ao clicar no trigger e notifica a mudança', async () => {
      await userEvent.click(trigger);
      const dialog = await waitForPortal('alertdialog');
      await expect(dialog).toBeVisible();
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      await waitFor(() => expect(openedWith(true)).toBe(true));
    });

    await step('Content expõe role alertdialog e isola o fundo', async () => {
      const dialog = await waitForPortal('alertdialog');
      await expect(dialog).toHaveAttribute('role', 'alertdialog');
      // A lib não emite `aria-modal`: marca tudo fora do painel com
      // aria-hidden, o que entrega o mesmo isolamento para leitores de tela.
      await expect(trigger.closest('[aria-hidden="true"]')).not.toBeNull();
      // O painel em si fica fora da subárvore escondida.
      await expect(dialog.closest('[aria-hidden="true"]')).toBeNull();
    });

    await step('aria-labelledby e aria-describedby apontam para Title e Description', async () => {
      const dialog = await waitForPortal('alertdialog');
      const title = dialog.querySelector<HTMLElement>('[data-slot="alert-dialog-title"]');
      const description = dialog.querySelector<HTMLElement>(
        '[data-slot="alert-dialog-description"]',
      );
      await expect(title).not.toBeNull();
      await expect(description).not.toBeNull();
      await expect(title!.id).not.toBe('');
      await expect(description!.id).not.toBe('');
      await expect(dialog).toHaveAttribute('aria-labelledby', title!.id);
      await expect(dialog).toHaveAttribute('aria-describedby', description!.id);
      await expect(title).toHaveTextContent(/Excluir sua conta\?/i);
      await expect(description).toHaveTextContent(/Essa ação é permanente/i);
    });

    await step('Foco inicial em Cancelar, não na ação destrutiva', async () => {
      const dialog = await waitForPortal('alertdialog');
      const cancel = within(dialog).getByRole('button', { name: /Cancelar/i });
      const action = within(dialog).getByRole('button', { name: /Excluir conta/i });
      // O foco entra no painel depois da animação de abertura — daí o waitFor.
      await waitFor(() => expect(cancel).toHaveFocus());
      await expect(action).not.toHaveFocus();
    });

    await step('Tab e Shift+Tab alternam entre Cancelar e a ação', async () => {
      const dialog = await waitForPortal('alertdialog');
      const cancel = within(dialog).getByRole('button', { name: /Cancelar/i });
      const action = within(dialog).getByRole('button', { name: /Excluir conta/i });

      // Movimentação de foco por teclado é síncrona: sem waitFor, senão um bug
      // real de ordem de tabulação passaria despercebido.
      await userEvent.tab();
      await expect(action).toHaveFocus();

      await userEvent.tab({ shift: true });
      await expect(cancel).toHaveFocus();
    });

    await step('Focus trap: Tab repetido nunca sai do diálogo', async () => {
      const dialog = await waitForPortal('alertdialog');
      const cancel = within(dialog).getByRole('button', { name: /Cancelar/i });
      const action = within(dialog).getByRole('button', { name: /Excluir conta/i });
      const focused = new Set<Element>();

      // 4 tabulações: com o trap ativo o foco só pode alternar entre os dois
      // botões (ou o próprio painel, que tem tabindex -1).
      for (let i = 0; i < 4; i += 1) {
        await userEvent.tab();
        await expect(dialog).toContainElement(document.activeElement as HTMLElement);
        focused.add(document.activeElement!);
      }
      await expect(focused.has(cancel)).toBe(true);
      await expect(focused.has(action)).toBe(true);
    });

    await step('Clique no overlay não fecha — a decisão é obrigatória', async () => {
      const dialog = await waitForPortal('alertdialog');
      const overlay = document.querySelector<HTMLElement>(
        '[data-slot="alert-dialog-overlay"]',
      );
      await expect(overlay).not.toBeNull();
      overlay!.click();
      await expect(dialog).toBeVisible();
      await expect(openedWith(false)).toBe(false);
    });

    await step('Escape fecha o diálogo e devolve o foco ao trigger', async () => {
      await userEvent.keyboard('{Escape}');
      await waitForPortalGone('alertdialog');
      await waitFor(() => expect(openedWith(false)).toBe(true));
      // Restauração de foco é síncrona ao desmonte: sem waitFor.
      await expect(trigger).toHaveFocus();
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    await step('Reaberto, Cancelar dispara o handler e fecha o diálogo', async () => {
      await userEvent.click(trigger);
      const dialog = await waitForPortal('alertdialog');
      const cancel = within(dialog).getByRole('button', { name: /Cancelar/i });

      await userEvent.click(cancel);
      await expect(onCancel).toHaveBeenCalled();
      await waitForPortalGone('alertdialog');
      // A ação destrutiva nunca foi acionada em nenhum momento do fluxo.
      await expect(onConfirm).not.toHaveBeenCalled();
      await expect(trigger).toHaveFocus();
    });
  },
};
