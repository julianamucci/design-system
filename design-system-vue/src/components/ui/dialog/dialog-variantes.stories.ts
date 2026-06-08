import type { Meta, StoryObj } from '@storybook/vue3';
import { within, expect } from 'storybook/test';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogScrollContent,
  DialogTitle,
  DialogTrigger,
} from './index';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { waitForPortal } from '@/lib/wait-for-portal';

const meta = {
  title: 'UI/Dialog/Variantes',
  component: Dialog,
  tags: ['overlay'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Composicoes estruturais recorrentes do Dialog. Não há prop variant — escolha a estrutura que melhor descreve o caso de uso.',
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
  DialogScrollContent,
  DialogTitle,
  DialogTrigger,
  Button,
  Input,
  Label,
};

export const Default: Story = {
  parameters: {
    docs: {
      description: { story: 'Title + Description + Footer com ação primária. Composição padrão.' },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <Dialog default-open>
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
  },
};

export const WithForm: Story = {
  parameters: {
    docs: {
      description: { story: 'Body com formulário inline. Submissão dispara a ação primária do Footer.' },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <Dialog default-open>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar perfil</DialogTitle>
            <DialogDescription>Atualize seu nome e email. As mudanças entram em vigor após salvar.</DialogDescription>
          </DialogHeader>
          <form class="grid gap-3">
            <div class="grid gap-1.5">
              <Label for="name">Nome</Label>
              <Input id="name" defaultValue="Juliana Mucci" />
            </div>
            <div class="grid gap-1.5">
              <Label for="email">Email</Label>
              <Input id="email" type="email" defaultValue="juliana@example.com" />
            </div>
          </form>
          <DialogFooter>
            <DialogClose as-child>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button type="submit">Salvar alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    `,
  }),
  play: async () => {
    const body = within(document.body);
    const dialog = await waitForPortal('dialog');
    await expect(dialog).toBeVisible();
    const nameInput = await body.findByLabelText(/Nome/i);
    await expect(nameInput).toBeVisible();
  },
};

export const WithScrollContent: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Body com conteúdo longo e scroll interno via DialogScrollContent (exclusivo do Vue/Reka UI). Header e Footer fixos.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <Dialog default-open>
        <DialogScrollContent class="max-w-lg">
          <DialogHeader>
            <DialogTitle>Termos de serviço</DialogTitle>
            <DialogDescription>Leia atentamente os termos antes de aceitar.</DialogDescription>
          </DialogHeader>
          <div class="space-y-3 text-sm text-muted-foreground max-h-72 overflow-y-auto">
            <p v-for="i in 12" :key="i">
              Parágrafo {{ i }} — Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
              incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation
              ullamco laboris nisi ut aliquip ex ea commodo consequat.
            </p>
          </div>
          <DialogFooter>
            <DialogClose as-child>
              <Button variant="outline">Recusar</Button>
            </DialogClose>
            <Button>Aceitar termos</Button>
          </DialogFooter>
        </DialogScrollContent>
      </Dialog>
    `,
  }),
  play: async () => {
    const dialog = await waitForPortal('dialog');
    await expect(dialog).toHaveAttribute('data-state', 'open');
  },
};

export const NoFooter: Story = {
  parameters: {
    docs: {
      description: { story: 'Apenas Title + Description, sem Footer. Para uso informativo passivo.' },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <Dialog default-open>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes do pedido #4287</DialogTitle>
            <DialogDescription>
              Pedido confirmado em 15 de março às 14:32. Entrega prevista para 20 de março via transportadora parceira.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    `,
  }),
  play: async () => {
    const body = within(document.body);
    const dialog = await waitForPortal('dialog');
    await expect(dialog).toBeVisible();
  },
};

export const WithDestructiveAction: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Footer com ação destrutiva. Use só quando a destrutividade é secundária ao fluxo (ex: remover item de lista). Para confirmações irreversíveis principais, prefira AlertDialog.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <Dialog default-open>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover anexo</DialogTitle>
            <DialogDescription>O anexo será removido desta mensagem. Você pode adicioná-lo novamente depois.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose as-child>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button variant="destructive">Remover anexo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    `,
  }),
  play: async () => {
    const body = within(document.body);
    const dialog = await waitForPortal('dialog');
    await expect(dialog).toBeVisible();
    const action = await body.findByRole('button', { name: /Remover anexo/i });
    await expect(action).toHaveAttribute('data-variant', 'destructive');
  },
};

export const CustomCloseInFooter: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'showCloseButton={false} no Content e botão Close inline no Footer abaixo das ações.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <Dialog default-open>
        <DialogContent :showCloseButton="false">
          <DialogHeader>
            <DialogTitle>Configuracoes de notificação</DialogTitle>
            <DialogDescription>Escolha como deseja ser avisado sobre novas atividades.</DialogDescription>
          </DialogHeader>
          <DialogFooter class="flex-col gap-2 sm:flex-col">
            <Button>Salvar preferências</Button>
            <DialogClose as-child>
              <Button variant="ghost">Fechar</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    `,
  }),
  play: async () => {
    const body = within(document.body);
    const dialog = await waitForPortal('dialog');
    await expect(dialog).toBeVisible();
  },
};
