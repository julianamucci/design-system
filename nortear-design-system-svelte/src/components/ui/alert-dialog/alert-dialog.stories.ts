import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { userEvent, within, expect, waitFor, fn } from 'storybook/test';
import { AlertDialog } from './index';
import AlertDialogStory from './AlertDialogStory.svelte';
import AlertDialogDocs from '@/components/docs/AlertDialogDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const meta = {
  title: 'UI/AlertDialog',
  component: AlertDialog,
  tags: ['autodocs', 'overlay'],
  parameters: {
    docs: { page: withAutoDocsTab(AlertDialogDocs) },
  },
  // O docgen do Svelte está desligado no .storybook/main.ts: a aba
  // "API Reference" sai só destes argTypes. Props que o wrapper da story não
  // encaminha ficam como documentação (control: false).
  argTypes: {
    open: {
      control: 'boolean',
      description: 'Estado de abertura. Bindable com bind:open — define também o estado inicial.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    onOpenChange: {
      control: false,
      description: 'Callback disparado quando o diálogo abre ou fecha.',
      table: { type: { summary: '(open: boolean) => void' }, defaultValue: { summary: '—' } },
    },
    onOpenChangeComplete: {
      control: false,
      description: 'Callback disparado quando a transição de abertura ou fechamento termina.',
      table: { type: { summary: '(open: boolean) => void' }, defaultValue: { summary: '—' } },
    },
    children: {
      control: false,
      description: 'Snippet de composição: Trigger, Content, Header, Footer, Cancel e Action.',
      table: { type: { summary: 'Snippet' }, defaultValue: { summary: '—' } },
    },
  },
  args: {
    open: false,
    // Único callback da raiz que o wrapper da story encaminha — popula a aba
    // Actions e permite asseverar a notificação de mudança no play.
    onOpenChange: fn(),
  },
} satisfies Meta<typeof AlertDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

// Handlers do wrapper (não são props da raiz, logo ficam fora de `args`/`argTypes`
// para não poluir a aba API Reference). No escopo do módulo para não recriar
// spies a cada re-render disparado pelos controls.
const playgroundConfirm = fn();
const playgroundCancel = fn();

export const Playground: Story = {
  // Sem docgen, o gerador de source monta a tag a partir do nome interno da
  // função compilada (`<wrapper …/>`). O snippet vai explícito, montado a
  // partir dos args para acompanhar os controls.
  parameters: {
    docs: {
      source: {
        transform: (_generated: string, ctx: { args?: { open?: boolean } }) => {
          const open = ctx.args?.open ?? false;
          return `<script lang="ts">
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
  } from "@/components/ui/alert-dialog";
  import { Button } from "@/components/ui/button";

  let open = $state(${open});
</script>

<AlertDialog bind:open>
  <AlertDialogTrigger>
    {#snippet child({ props })}
      <Button {...props} variant="destructive">Excluir conta</Button>
    {/snippet}
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Excluir sua conta?</AlertDialogTitle>
      <AlertDialogDescription>Essa ação é permanente.</AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancelar</AlertDialogCancel>
      <AlertDialogAction variant="destructive">Excluir conta</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>`;
        },
      },
    },
  },
  render: (args) => ({
    Component: AlertDialogStory,
    props: {
      open: args.open,
      onOpenChange: args.onOpenChange,
      onConfirm: playgroundConfirm,
      onCancel: playgroundCancel,
    },
  }),
  play: async ({ args, canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);

    await step('Trigger está presente no DOM', async () => {
      const trigger = canvas.getByRole('button', { name: /Excluir conta/i });
      await expect(trigger).toBeInTheDocument();
    });

    await step('Diálogo abre ao clicar no trigger e notifica a mudança', async () => {
      const trigger = canvas.getByRole('button', { name: /Excluir conta/i });
      await userEvent.click(trigger);
      const dialog = await body.findByRole('alertdialog');
      // O painel entra animando (opacity 0 → 1). Sem waitFor a asserção roda no
      // primeiro quadro, quando toBeVisible() ainda reprova por opacity: 0.
      await waitFor(() => expect(dialog).toBeVisible());
      await expect(args.onOpenChange).toHaveBeenCalledWith(true);
    });

    await step('Content expõe role alertdialog e aria-modal', async () => {
      const dialog = await body.findByRole('alertdialog');
      await expect(dialog).toHaveAttribute('role', 'alertdialog');
      await expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    await step('aria-labelledby e aria-describedby apontam para Title e Description', async () => {
      const dialog = await body.findByRole('alertdialog');
      const labelledBy = dialog.getAttribute('aria-labelledby');
      const describedBy = dialog.getAttribute('aria-describedby');
      await expect(labelledBy).toBeTruthy();
      await expect(describedBy).toBeTruthy();
      await expect(document.getElementById(labelledBy!)).toHaveTextContent(/Excluir sua conta/i);
      await expect(document.getElementById(describedBy!)).toHaveTextContent(
        /Essa ação é permanente/i
      );
      await expect(dialog).toHaveAccessibleName(/Excluir sua conta/i);
    });

    await step('Foco inicial fica no painel do diálogo', async () => {
      const dialog = await body.findByRole('alertdialog');
      await waitFor(() => expect(dialog).toHaveFocus());
    });

    await step('Tab percorre Cancelar e depois a ação de confirmação', async () => {
      const dialog = await body.findByRole('alertdialog');
      const scope = within(dialog);
      await userEvent.tab();
      await expect(scope.getByRole('button', { name: /Cancelar/i })).toHaveFocus();
      await userEvent.tab();
      await expect(scope.getByRole('button', { name: /Excluir conta/i })).toHaveFocus();
    });

    await step('Shift+Tab devolve o foco ao Cancelar', async () => {
      const dialog = await body.findByRole('alertdialog');
      await userEvent.tab({ shift: true });
      await expect(within(dialog).getByRole('button', { name: /Cancelar/i })).toHaveFocus();
    });

    await step('Focus trap: Tab repetido nunca sai do diálogo', async () => {
      const dialog = await body.findByRole('alertdialog');
      for (let i = 0; i < 4; i += 1) {
        await userEvent.tab();
        await expect(dialog.contains(document.activeElement)).toBe(true);
      }
    });

    await step('Escape fecha o diálogo e devolve o foco ao trigger', async () => {
      await userEvent.keyboard('{Escape}');
      await waitFor(() => expect(body.queryByRole('alertdialog')).not.toBeInTheDocument());
      await expect(args.onOpenChange).toHaveBeenCalledWith(false);
      const trigger = canvas.getByRole('button', { name: /Excluir conta/i });
      await waitFor(() => expect(trigger).toHaveFocus());
    });
  },
};
