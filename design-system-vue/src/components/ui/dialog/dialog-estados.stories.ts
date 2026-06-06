import type { Meta, StoryObj } from '@storybook/vue3';
import { ref } from 'vue';
import { userEvent, within, expect } from 'storybook/test';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './index';
import { Button } from '@/components/ui/button';
import { waitForPortal } from '@/lib/wait-for-portal';

const meta = {
  title: 'UI/Dialog/Estados',
  component: Dialog,
  tags: ['overlay'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Estados canônicos do Dialog: closed, open, withCloseButtonHidden e controlled (controle externo via open + onUpdate:open).',
      },
    },
  },
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

const sharedComponents = {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Button,
};

export const Closed: Story = {
  parameters: {
    docs: {
      description: { story: 'Estado inicial — apenas o trigger é visível. Portal vazio.' },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <Dialog>
        <DialogTrigger as-child>
          <Button>Editar perfil</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar perfil</DialogTitle>
            <DialogDescription>Atualize suas informações pessoais.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose as-child>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button>Salvar alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    const trigger = canvas.getByRole('button', { name: /Editar perfil/i });
    await expect(trigger).toBeVisible();
    await expect(body.queryByRole('dialog')).not.toBeInTheDocument();
  },
};

export const Open: Story = {
  parameters: {
    docs: {
      description: { story: 'Diálogo aberto via defaultOpen. Captura visual no Chromatic.' },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <Dialog default-open>
        <DialogTrigger as-child>
          <Button>Editar perfil</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar perfil</DialogTitle>
            <DialogDescription>Atualize suas informações pessoais. As mudanças são salvas ao confirmar.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose as-child>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button>Salvar alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    `,
  }),
  play: async () => {
    const body = within(document.body);
    const dialog = await waitForPortal('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
  },
};

export const WithCloseButtonHidden: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'showCloseButton={false} no Content. Sem X no canto — fechamento apenas por Escape, clique no overlay ou ação do Footer.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <Dialog default-open>
        <DialogContent :showCloseButton="false">
          <DialogHeader>
            <DialogTitle>Aceitar atualização</DialogTitle>
            <DialogDescription>Uma nova versão está disponível. Clique em continuar para atualizar.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose as-child>
              <Button variant="outline">Mais tarde</Button>
            </DialogClose>
            <Button>Atualizar agora</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    `,
  }),
  play: async () => {
    const body = within(document.body);
    const dialog = await waitForPortal('dialog');
    await expect(dialog).toBeVisible();
    // Deve haver Mais tarde, Atualizar agora, mas NÃO o Close (sr-only="Close")
    const closeBtn = body.queryByRole('button', { name: /^Close$/i });
    await expect(closeBtn).not.toBeInTheDocument();
  },
};

export const Controlled: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Abertura controlada por estado externo via open + onUpdate:open.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    setup() {
      const open = ref(false);
      return { open };
    },
    template: `
      <div class="flex flex-col gap-3">
        <Button @click="open = true">Abrir via estado externo</Button>
        <Dialog :open="open" @update:open="(v) => open = v">
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Controlado pelo pai</DialogTitle>
              <DialogDescription>
                Este diálogo é comandado por estado externo via open e update:open.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose as-child>
                <Button variant="outline">Cancelar</Button>
              </DialogClose>
              <Button @click="open = false">Confirmar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);

    await step('Clique no trigger externo abre o diálogo', async () => {
      const trigger = canvas.getByRole('button', { name: /Abrir via estado externo/i });
      await userEvent.click(trigger);
      const dialog = await waitForPortal('dialog');
      await expect(dialog).toBeVisible();
    });

    await step('Escape fecha o diálogo controlado', async () => {
      await userEvent.keyboard('{Escape}');
      await expect(body.queryByRole('dialog')).not.toBeInTheDocument();
    });
  },
};
