import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
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

const meta = {
  title: 'UI/AlertDialog/Estados',
  component: AlertDialog,
  tags: ['overlay'],
  parameters: {
    design: figmaDesign('alertDialog'),
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      description: {
        component:
          'Cada estado canônico do AlertDialog: closed, open, confirmed, cancelled e controlled.',
      },
    },
  },
} satisfies Meta<typeof AlertDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

const sharedComponents = {
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
};

// Spies em escopo de módulo: o `setup()` da story só devolve bindings para o
// template, e a play function precisa da mesma referência para asseverar que o
// handler do consumidor disparou. `mockClear()` no setup zera a cada render.
const onConfirmSpy = fn();
const onCancelSpy = fn();
const onCancelActionSpy = fn();
const onOpenChangeSpy = fn();

export const Closed: Story = {
  parameters: {
    docs: {
      description: { story: 'Estado inicial — apenas o trigger é visível.' },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <AlertDialog>
        <AlertDialogTrigger as-child>
          <Button variant="destructive">Excluir item</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction variant="destructive">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    const trigger = canvas.getByRole('button', { name: /Excluir item/i });
    await expect(trigger).toBeVisible();
    await expect(body.queryByRole('alertdialog')).not.toBeInTheDocument();
  },
};

export const Open: Story = {
  parameters: {
    // A story termina com o diálogo aberto: é sobre ela que o addon-a11y roda
    // a varredura axe (contraste incluído) do estado aberto.
    covers: ['functional.item6', 'accessibility.item6', 'accessibility.item7'],
    docs: {
      description: {
        story: 'Diálogo aberto com `defaultOpen`. Captura visual no Chromatic.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <AlertDialog default-open>
        <AlertDialogTrigger as-child>
          <Button variant="destructive">Excluir item</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir item permanentemente?</AlertDialogTitle>
            <AlertDialogDescription>
              O item será removido de forma definitiva e não poderá ser recuperado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction variant="destructive">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    // `hidden: true`: a story nasce com o diálogo aberto, então o conteúdo do
    // canvas já está fora da árvore de acessibilidade (aria-hidden) quando a
    // play começa. O nó continua sendo o mesmo trigger para foco e clique.
    const trigger = canvas.getByRole('button', {
      name: /Excluir item/i,
      hidden: true,
    });

    await step('Diálogo já nasce aberto e com foco no Cancel', async () => {
      const dialog = await body.findByRole('alertdialog');
      // A entrada do painel é animada (opacidade 0 → 1). Sem waitFor a asserção
      // roda no primeiro quadro e reprova um elemento que ainda vai aparecer.
      await waitFor(() => expect(dialog).toBeVisible());
      const cancel = within(dialog).getByRole('button', { name: /Cancelar/i });
      await waitFor(() => expect(cancel).toHaveFocus());
    });

    await step('Tab leva o foco ao Action e Enter o ativa, fechando o diálogo', async () => {
      const dialog = await body.findByRole('alertdialog');
      const action = within(dialog).getByRole('button', { name: /^Excluir$/i });
      await userEvent.tab();
      await expect(action).toHaveFocus();

      await userEvent.keyboard('{Enter}');
      await waitFor(() =>
        expect(body.queryByRole('alertdialog')).not.toBeInTheDocument(),
      );
      await waitFor(() => expect(trigger).toHaveFocus());
    });

    await step('Space no Cancel também ativa o botão e fecha o diálogo', async () => {
      await userEvent.click(trigger);
      const dialog = await body.findByRole('alertdialog');
      await waitFor(() => expect(dialog).toBeVisible());

      const cancel = within(dialog).getByRole('button', { name: /Cancelar/i });
      await waitFor(() => expect(cancel).toHaveFocus());
      await userEvent.keyboard(' ');
      await waitFor(() =>
        expect(body.queryByRole('alertdialog')).not.toBeInTheDocument(),
      );
    });

    await step('Reabre para deixar o estado aberto na captura visual', async () => {
      await userEvent.click(trigger);
      const dialog = await body.findByRole('alertdialog');
      await waitFor(() => expect(dialog).toBeVisible());
    });

    // O overlay do alertdialog é inerte por decisão de acessibilidade (WAI-ARIA
    // APG: a decisão precisa ser explícita), então clicar fora NÃO cancela.
    // O reka-ui faz isso com withModifiers(() => {}, ['prevent']) no
    // onInteractOutside. Mesma asserção nas 4 stacks.
    await step('Clique no overlay não fecha o diálogo', async () => {
      const overlay = document.querySelector<HTMLElement>('[data-slot="alert-dialog-overlay"]');
      await expect(overlay).toBeInTheDocument();
      await userEvent.click(overlay!);
      const dialog = await body.findByRole('alertdialog');
      await waitFor(() => expect(dialog).toBeVisible());
    });
  },
};

export const Confirmed: Story = {
  parameters: {
    covers: ['functional.item2'],
    docs: {
      description: { story: 'Clique em Action dispara o handler e fecha o diálogo.' },
    },
  },
  render: () => ({
    components: sharedComponents,
    setup() {
      onConfirmSpy.mockClear();
      return { onConfirm: onConfirmSpy };
    },
    // O trigger existe para que o retorno de foco ao fechar tenha destino —
    // parte de functional.item2, não só o callback e o fechamento.
    template: `
      <AlertDialog default-open>
        <AlertDialogTrigger as-child>
          <Button variant="destructive">Excluir item</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>Esta ação é permanente.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              @click="onConfirm"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    // `hidden: true`: a story nasce aberta, então o trigger já está sob
    // aria-hidden quando a play começa. Continua sendo o mesmo nó para o foco.
    const trigger = canvas.getByRole('button', { name: /Excluir item/i, hidden: true });

    await step('Diálogo começa aberto', async () => {
      const dialog = await body.findByRole('alertdialog');
      // A entrada do painel é animada (opacidade 0 → 1). Sem waitFor a asserção
      // roda no primeiro quadro e reprova um elemento que ainda vai aparecer.
      await waitFor(() => expect(dialog).toBeVisible());
    });

    await step('Clique em Excluir dispara o handler do consumidor', async () => {
      const dialog = await body.findByRole('alertdialog');
      const action = within(dialog).getByRole('button', { name: /^Excluir$/i });
      await userEvent.click(action);
      await waitFor(() => expect(onConfirmSpy).toHaveBeenCalledTimes(1));
    });

    await step('Confirmar fecha o diálogo e devolve o foco ao trigger', async () => {
      await waitFor(() =>
        expect(body.queryByRole('alertdialog')).not.toBeInTheDocument(),
      );
      await waitFor(() => expect(trigger).toHaveFocus());
    });
  },
};

export const Cancelled: Story = {
  parameters: {
    docs: {
      description: { story: 'Cancel é clicado — diálogo fecha sem executar ação.' },
    },
  },
  render: () => ({
    components: sharedComponents,
    setup() {
      onCancelSpy.mockClear();
      onCancelActionSpy.mockClear();
      return { onCancel: onCancelSpy, onAction: onCancelActionSpy };
    },
    template: `
      <AlertDialog default-open>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>Esta ação é permanente.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel @click="onCancel">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              @click="onAction"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    `,
  }),
  play: async ({ step }) => {
    const body = within(document.body);

    await step('Diálogo começa aberto', async () => {
      const dialog = await body.findByRole('alertdialog');
      // A entrada do painel é animada (opacidade 0 → 1). Sem waitFor a asserção
      // roda no primeiro quadro e reprova um elemento que ainda vai aparecer.
      await waitFor(() => expect(dialog).toBeVisible());
    });

    await step('Clique em Cancelar dispara só o handler de cancelamento', async () => {
      const dialog = await body.findByRole('alertdialog');
      const cancel = within(dialog).getByRole('button', { name: /Cancelar/i });
      await userEvent.click(cancel);
      await waitFor(() => expect(onCancelSpy).toHaveBeenCalledTimes(1));
      await expect(onCancelActionSpy).not.toHaveBeenCalled();
    });

    await step('Cancelar fecha o diálogo', async () => {
      await waitFor(() =>
        expect(body.queryByRole('alertdialog')).not.toBeInTheDocument(),
      );
    });
  },
};

export const Controlled: Story = {
  parameters: {
    covers: ['functional.item7'],
    docs: {
      description: {
        story: 'Abertura controlada por estado externo via `open` + `onUpdate:open`.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    setup() {
      const open = ref(false);
      onOpenChangeSpy.mockClear();
      const onOpenChange = (value: boolean) => {
        onOpenChangeSpy(value);
        open.value = value;
      };
      return { open, onOpenChange };
    },
    template: `
      <div class="nds-stack" data-spacing="sm">
        <Button variant="destructive" @click="open = true">Abrir via estado externo</Button>
        <AlertDialog :open="open" @update:open="onOpenChange">
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Controlado pelo pai</AlertDialogTitle>
              <AlertDialogDescription>
                Este diálogo é comandado por estado externo via open e update:open.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Fechar</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                @click="open = false"
              >
                Confirmar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);

    await step('Clique no trigger externo abre o diálogo', async () => {
      const trigger = canvas.getByRole('button', { name: /Abrir via estado externo/i });
      await userEvent.click(trigger);
      const dialog = await body.findByRole('alertdialog');
      // A entrada do painel é animada (opacidade 0 → 1). Sem waitFor a asserção
      // roda no primeiro quadro e reprova um elemento que ainda vai aparecer.
      await waitFor(() => expect(dialog).toBeVisible());
    });

    await step('Escape emite a mudança de estado e o pai fecha o diálogo', async () => {
      await userEvent.keyboard('{Escape}');
      await waitFor(() => expect(onOpenChangeSpy).toHaveBeenCalledWith(false));
      await waitFor(() =>
        expect(body.queryByRole('alertdialog')).not.toBeInTheDocument(),
      );
    });
  },
};
