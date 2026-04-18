import type { Meta, StoryObj } from '@storybook/vue3';
import { ref } from 'vue';
import { userEvent, within, expect } from 'storybook/test';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from './index';
import { Button } from '@/components/ui/button';

const meta = {
  title: 'UI/AlertDialog/Composições',
  component: AlertDialog,
} satisfies Meta<typeof AlertDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TriggerPersonalizado: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Use as-child no AlertDialogTrigger para qualquer elemento como gatilho — link, ícone, item de menu.',
      },
    },
  },
  render: () => ({
    components: {
      AlertDialog,
      AlertDialogTrigger,
      AlertDialogContent,
      AlertDialogHeader,
      AlertDialogTitle,
      AlertDialogDescription,
      AlertDialogFooter,
      AlertDialogAction,
      AlertDialogCancel,
    },
    setup() { return {}; },
    template: `
      <AlertDialog>
        <AlertDialogTrigger as-child>
          <span
            role="button"
            tabindex="0"
            class="text-sm text-destructive underline cursor-pointer hover:text-destructive/80"
            @keydown.enter="$event.currentTarget.click()"
            @keydown.space="$event.currentTarget.click()"
          >
            Excluir conta
          </span>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir conta</AlertDialogTitle>
            <AlertDialogDescription>
              Todos os seus dados serão removidos permanentemente. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: 'Excluir conta' });

    await step('Trigger personalizado está acessível', async () => {
      await expect(trigger).toBeInTheDocument();
    });

    await step('Clicar no trigger personalizado abre o modal', async () => {
      await userEvent.click(trigger);
      const dialog = await within(document.body).findByRole('alertdialog');
      await expect(dialog).toBeVisible();
    });

    await step('Fechar modal via Cancelar', async () => {
      const cancelBtn = within(document.body).getByRole('button', { name: 'Cancelar' });
      await userEvent.click(cancelBtn);
      await expect(within(document.body).queryByRole('alertdialog')).not.toBeInTheDocument();
    });
  },
};

export const ComIcone: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Trigger com ícone — útil em tabelas ou listas de ações. O aria-label garante acessibilidade.',
      },
    },
  },
  render: () => ({
    components: {
      AlertDialog,
      AlertDialogTrigger,
      AlertDialogContent,
      AlertDialogHeader,
      AlertDialogTitle,
      AlertDialogDescription,
      AlertDialogFooter,
      AlertDialogAction,
      AlertDialogCancel,
      Button,
    },
    setup() { return {}; },
    template: `
      <AlertDialog>
        <AlertDialogTrigger as-child>
          <Button variant="ghost" size="icon" aria-label="Excluir item">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-destructive">
              <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
            </svg>
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir item selecionado</AlertDialogTitle>
            <AlertDialogDescription>
              O item será removido permanentemente da sua lista. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: 'Excluir item' });

    await step('Trigger ícone tem aria-label acessível', async () => {
      await expect(trigger).toBeInTheDocument();
      await expect(trigger).toHaveAttribute('aria-label', 'Excluir item');
    });

    await step('Clicar no ícone abre o modal', async () => {
      await userEvent.click(trigger);
      const dialog = await within(document.body).findByRole('alertdialog');
      await expect(dialog).toBeVisible();
    });

    await step('Fechar modal via Cancelar', async () => {
      const cancelBtn = within(document.body).getByRole('button', { name: 'Cancelar' });
      await userEvent.click(cancelBtn);
      await expect(within(document.body).queryByRole('alertdialog')).not.toBeInTheDocument();
    });
  },
};

export const ControlledState: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Modo controlado usando open e onOpenChange — útil quando a abertura depende de lógica externa.',
      },
    },
  },
  render: () => ({
    components: {
      AlertDialog,
      AlertDialogTrigger,
      AlertDialogContent,
      AlertDialogHeader,
      AlertDialogTitle,
      AlertDialogDescription,
      AlertDialogFooter,
      AlertDialogAction,
      AlertDialogCancel,
      Button,
    },
    setup() {
      const open = ref(false);
      return { open };
    },
    template: `
      <div class="space-y-4">
        <p class="text-sm text-muted-foreground">
          Estado: <strong>{{ open ? 'aberto' : 'fechado' }}</strong>
        </p>
        <AlertDialog :open="open" @update:open="open = $event">
          <AlertDialogTrigger as-child>
            <Button variant="outline" @click="open = true">Abrir modal controlado</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar ação</AlertDialogTitle>
              <AlertDialogDescription>
                Este modal usa estado controlado via open/onOpenChange.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel @click="open = false">Cancelar</AlertDialogCancel>
              <AlertDialogAction @click="open = false">Confirmar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    `,
  }),
};
