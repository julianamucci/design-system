import type { Meta, StoryObj } from '@storybook/vue3';
import { userEvent, within, expect, waitFor } from 'storybook/test';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from './index';
import { Button } from '@/components/ui/button';
import DrawerDocs from '@/components/docs/DrawerDocs.vue';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { waitForPortal } from '@/lib/wait-for-portal';

const meta = {
  title: 'UI/Drawer',
  component: Drawer,
  tags: ['autodocs', 'disclosure'],
  parameters: {
    docs: {
      page: withAutoDocsTab(DrawerDocs),
      description: {
        component:
          'Drawer (vaul-vue) é um painel deslizante mobile-first com gestos de arrastar. Renderiza em portal com overlay, focus trap, role=dialog e aria-modal automáticos. Suporta 4 direções (bottom, top, left, right).',
      },
    },
  },
  argTypes: {
    direction: {
      control: { type: 'select' },
      options: ['bottom', 'top', 'left', 'right'],
      description: 'Direção de entrada do painel.',
    },
    defaultOpen: {
      control: 'boolean',
      description: 'Estado inicial em modo não-controlado.',
    },
    dismissible: {
      control: 'boolean',
      description: 'Permite fechar via swipe, ESC ou clique no overlay.',
    },
    modal: {
      control: 'boolean',
      description: 'Quando true, bloqueia interação com o resto da página.',
    },
  },
  args: {
    direction: 'bottom',
    defaultOpen: false,
    dismissible: true,
    modal: true,
  },
} satisfies Meta<typeof Drawer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => ({
    components: {
      Drawer,
      DrawerClose,
      DrawerContent,
      DrawerDescription,
      DrawerFooter,
      DrawerHeader,
      DrawerTitle,
      DrawerTrigger,
      Button,
    },
    setup() {
      return { args };
    },
    template: `
      <div style="contain: layout">
        <Drawer :key="String(args.defaultOpen) + args.direction" v-bind="args">
          <DrawerTrigger as-child>
            <Button variant="outline">Abrir drawer</Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Editar perfil</DrawerTitle>
              <DrawerDescription>
                Atualize seus dados pessoais e foto. As mudanças são salvas ao confirmar.
              </DrawerDescription>
            </DrawerHeader>
            <div class="px-4 pb-4 text-sm text-muted-foreground">
              Conteúdo do drawer.
            </div>
            <DrawerFooter>
              <Button>Confirmar</Button>
              <DrawerClose as-child>
                <Button variant="outline">Cancelar</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);

    const waitForClose = async () => {
      await waitFor(
        () => {
          const dialog = body.queryByRole('dialog');
          if (dialog) throw new Error('drawer ainda aberto');
        },
        { timeout: 1500 },
      );
    };

    await step('1. Trigger renderiza', async () => {
      const trigger = canvas.getByRole('button', { name: /Abrir drawer/i });
      await expect(trigger).toBeInTheDocument();
    });

    await step('2. Click no trigger abre o drawer com role=dialog e aria-modal', async () => {
      const trigger = canvas.getByRole('button', { name: /Abrir drawer/i });
      await userEvent.click(trigger);
      const dialog = await waitForPortal('dialog');
      await expect(dialog).toBeVisible();
      await expect(dialog).toHaveAttribute('aria-modal', 'true');
      await expect(dialog).toHaveAccessibleName(/Editar perfil/i);
    });

    await step('3. data-vaul-drawer-direction está presente no Content', async () => {
      const content = document.querySelector('[data-slot="drawer-content"]');
      await expect(content).not.toBeNull();
      await expect(content).toHaveAttribute('data-vaul-drawer-direction');
    });

    await step('4. ESC fecha o drawer', async () => {
      await userEvent.keyboard('{Escape}');
      await waitForClose();
    });

    await step('5. Reabrir e fechar via DrawerClose', async () => {
      const trigger = canvas.getByRole('button', { name: /Abrir drawer/i });
      await userEvent.click(trigger);
      const dialog = await waitForPortal('dialog');
      const cancel = within(dialog as HTMLElement).getByRole('button', { name: /Cancelar/i });
      await userEvent.click(cancel);
      await waitForClose();
    });
  },
};
