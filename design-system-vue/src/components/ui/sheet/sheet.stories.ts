import type { Meta, StoryObj } from '@storybook/vue3';
import { userEvent, within, expect, fn, waitFor } from 'storybook/test';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './index';
import { Button } from '@/components/ui/button';
import SheetDocs from '@/components/docs/SheetDocs.vue';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { waitForPortal } from '@/lib/wait-for-portal';

const meta = {
  title: 'UI/Sheet',
  component: Sheet,
  tags: ['autodocs', 'disclosure'],
  parameters: {
    docs: { page: withAutoDocsTab(SheetDocs) },
  },
  argTypes: {
    defaultOpen: {
      control: 'boolean',
      description: 'Se o Sheet inicia aberto (útil para capturas visuais).',
    },
  },
  args: {
    defaultOpen: false,
  },
} satisfies Meta<typeof Sheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => ({
    components: {
      Sheet,
      SheetClose,
      SheetContent,
      SheetDescription,
      SheetFooter,
      SheetHeader,
      SheetTitle,
      SheetTrigger,
      Button,
    },
    setup() {
      const onAction = fn();
      const onCancel = fn();
      return { args, onAction, onCancel };
    },
    template: `
      <Sheet :key="String(args.defaultOpen)" v-bind="args">
        <SheetTrigger as-child>
          <Button variant="outline">Abrir filtros</Button>
        </SheetTrigger>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Filtros avançados</SheetTitle>
            <SheetDescription>
              Configure os filtros para refinar os resultados.
            </SheetDescription>
          </SheetHeader>
          <SheetFooter>
            <SheetClose as-child>
              <Button variant="outline" @click="onCancel">Cancelar</Button>
            </SheetClose>
            <Button @click="onAction">Aplicar filtros</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);

    const waitForClose = async () => {
      await waitFor(() => {
        const dialog = body.queryByRole('dialog');
        if (dialog) throw new Error('sheet still open');
      }, { timeout: 800 });
    };

    await step('1. Abre ao clicar no trigger', async () => {
      const trigger = canvas.getByRole('button', { name: /Abrir filtros/i });
      await expect(trigger).toBeInTheDocument();
      await userEvent.click(trigger);
      const dialog = await waitForPortal('dialog');
      await expect(dialog).toBeVisible();
      await expect(dialog).toHaveAccessibleName(/Filtros avançados/i);
    });

    await step('2. Focus trap — foco move para dentro do sheet', async () => {
      const dialog = await waitForPortal('dialog');
      await waitFor(() => {
        if (!dialog.contains(document.activeElement)) throw new Error('focus not trapped');
      });
    });

    await step('3. Escape fecha o sheet', async () => {
      await userEvent.keyboard('{Escape}');
      await waitForClose();
    });

    await step('4. Retorno de foco ao trigger após Escape', async () => {
      await waitFor(() => {
        const trigger = canvas.getByRole('button', { name: /Abrir filtros/i });
        if (document.activeElement !== trigger) throw new Error('focus did not return');
      });
    });

    await step('5. Reabrir e fechar via clique no overlay', async () => {
      const trigger = canvas.getByRole('button', { name: /Abrir filtros/i });
      await userEvent.click(trigger);
      await waitForPortal('dialog');
      const overlay = document.querySelector<HTMLElement>('[data-slot="sheet-overlay"]');
      await expect(overlay).not.toBeNull();
      overlay?.click();
      await waitForClose();
    });

    await step('6. Reabrir e fechar via botão Close (X)', async () => {
      const trigger = canvas.getByRole('button', { name: /Abrir filtros/i });
      await userEvent.click(trigger);
      const dialog = await waitForPortal('dialog');
      const closeBtn = within(dialog).getByRole('button', { name: /close/i });
      await userEvent.click(closeBtn);
      await waitForClose();
    });

    await step('7. Uncontrolled — fluxo via Cancel sem prop open', async () => {
      const trigger = canvas.getByRole('button', { name: /Abrir filtros/i });
      await userEvent.click(trigger);
      const dialog = await waitForPortal('dialog');
      const cancel = within(dialog).getByRole('button', { name: /Cancelar/i });
      await userEvent.click(cancel);
      await waitForClose();
    });
  },
};
