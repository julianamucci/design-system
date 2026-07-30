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
      table: { type: { summary: '(open: boolean) => void' } },
    },
    onOpenChangeComplete: {
      control: false,
      description: 'Callback disparado quando a transição de abertura ou fechamento termina.',
      table: { type: { summary: '(open: boolean) => void' } },
    },
    children: {
      control: false,
      description: 'Snippet de composição: Trigger, Content, Header, Footer, Cancel e Action.',
      table: { type: { summary: 'Snippet' } },
    },
  },
  args: {
    open: false,
  },
} satisfies Meta<typeof AlertDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

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
<\/script>

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
      onConfirm: fn(),
      onCancel: fn(),
    },
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
      await waitFor(
        () => {
          const dialog = body.queryByRole('alertdialog');
          if (dialog && dialog.getAttribute('data-state') !== 'closed') {
            throw new Error('dialog still open');
          }
        },
        { timeout: 500 }
      );
    });
  },
};
