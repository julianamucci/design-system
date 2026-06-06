import type { Meta, StoryObj } from '@storybook/vue3';
import { ref } from 'vue';
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
import { waitForPortal } from '@/lib/wait-for-portal';

const meta = {
  title: 'UI/Drawer/Estados',
  component: Drawer,
  tags: ['disclosure'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Estados canônicos do Drawer: Fechado (apenas trigger), Aberto (defaultOpen), Controlado (open + onUpdate:open) e NaoDismissible (sem ESC/overlay/swipe).',
      },
    },
  },
} satisfies Meta<typeof Drawer>;

export default meta;
type Story = StoryObj<typeof meta>;

const sharedComponents = {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  Button,
};

export const Fechado: Story = {
  parameters: {
    docs: { description: { story: 'Estado inicial — apenas o trigger é visível. Portal vazio.' } },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout">
        <Drawer>
          <DrawerTrigger as-child>
            <Button variant="outline">Abrir drawer</Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Editar perfil</DrawerTitle>
              <DrawerDescription>Atualize seus dados.</DrawerDescription>
            </DrawerHeader>
            <DrawerFooter>
              <DrawerClose as-child>
                <Button variant="outline">Cancelar</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    const trigger = canvas.getByRole('button', { name: /Abrir drawer/i });
    await expect(trigger).toBeVisible();
    await expect(body.queryByRole('dialog')).not.toBeInTheDocument();
  },
};

export const Aberto: Story = {
  parameters: {
    docs: { description: { story: 'Drawer aberto via defaultOpen. Captura visual no Chromatic.' } },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout">
        <Drawer :default-open="true">
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Editar perfil</DrawerTitle>
              <DrawerDescription>Atualize seus dados pessoais. As mudanças são salvas ao confirmar.</DrawerDescription>
            </DrawerHeader>
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
  play: async () => {
    const body = within(document.body);
    const dialog = await waitForPortal('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
  },
};

export const Controlado: Story = {
  parameters: {
    docs: { description: { story: 'Abertura controlada por estado externo via open + onUpdate:open.' } },
  },
  render: () => ({
    components: sharedComponents,
    setup() {
      const open = ref(false);
      return { open };
    },
    template: `
      <div class="flex flex-col gap-3" style="contain: layout">
        <Button @click="open = true">Abrir via estado externo</Button>
        <Drawer :open="open" @update:open="(v) => open = v">
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Controlado pelo pai</DrawerTitle>
              <DrawerDescription>Este drawer é comandado por estado externo via open e update:open.</DrawerDescription>
            </DrawerHeader>
            <DrawerFooter>
              <Button @click="open = false">Confirmar</Button>
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

    await step('Click no trigger externo abre o drawer', async () => {
      const trigger = canvas.getByRole('button', { name: /Abrir via estado externo/i });
      await userEvent.click(trigger);
      const dialog = await waitForPortal('dialog');
      await expect(dialog).toBeVisible();
    });

    await step('Escape fecha o drawer controlado', async () => {
      await userEvent.keyboard('{Escape}');
      await waitFor(
        () => {
          if (body.queryByRole('dialog')) throw new Error('drawer ainda aberto');
        },
        { timeout: 1500 },
      );
    });
  },
};

export const NaoDismissible: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'dismissible=false — drawer não pode ser fechado por ESC, swipe ou clique no overlay. Fechamento apenas via DrawerClose ou lógica de negócio.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout">
        <Drawer :default-open="true" :dismissible="false">
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Aceitar termos</DrawerTitle>
              <DrawerDescription>Você precisa aceitar os termos para continuar.</DrawerDescription>
            </DrawerHeader>
            <DrawerFooter>
              <Button>Aceitar</Button>
              <DrawerClose as-child>
                <Button variant="outline">Recusar</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </div>
    `,
  }),
  play: async () => {
    const body = within(document.body);
    const dialog = await waitForPortal('dialog');
    await expect(dialog).toBeVisible();
    // Botão Aceitar e Recusar visíveis
    await expect(body.getByRole('button', { name: /Aceitar/i })).toBeVisible();
    await expect(body.getByRole('button', { name: /Recusar/i })).toBeVisible();
  },
};
