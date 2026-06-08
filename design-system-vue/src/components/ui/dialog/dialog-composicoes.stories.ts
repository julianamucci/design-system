import type { Meta, StoryObj } from '@storybook/vue3';
import { within, expect } from 'storybook/test';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { waitForPortal } from '@/lib/wait-for-portal';

const meta = {
  title: 'UI/Dialog/Composicoes',
  component: Dialog,
  tags: ['overlay'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Composicoes canônicas de uso real do Dialog: confirmação de email, edição de perfil e pré-visualização de mídia.',
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
  Input,
  Label,
};

export const ConfirmEmail: Story = {
  parameters: {
    docs: {
      description: { story: 'Confirmação de troca de email com input inline.' },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <Dialog default-open>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar novo email</DialogTitle>
            <DialogDescription>
              Enviaremos um link de confirmação para o novo endereço. O email atual continua ativo até a confirmação.
            </DialogDescription>
          </DialogHeader>
          <div class="grid gap-1.5">
            <Label for="new-email">Novo email</Label>
            <Input id="new-email" type="email" placeholder="voce@example.com" />
          </div>
          <DialogFooter>
            <DialogClose as-child>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button>Enviar confirmação</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    `,
  }),
  play: async () => {
    const body = within(document.body);
    const dialog = await waitForPortal('dialog');
    await expect(dialog).toBeVisible();
    const action = await body.findByRole('button', { name: /Enviar confirmação/i });
    await expect(action).toBeVisible();
  },
};

export const ProfileEdit: Story = {
  parameters: {
    docs: {
      description: { story: 'Formulário de edição de perfil com múltiplos campos.' },
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
          <form class="grid gap-3">
            <div class="grid gap-1.5">
              <Label for="profile-name">Nome</Label>
              <Input id="profile-name" defaultValue="Juliana Mucci" />
            </div>
            <div class="grid gap-1.5">
              <Label for="profile-handle">Username</Label>
              <Input id="profile-handle" defaultValue="@julianamucci" />
            </div>
            <div class="grid gap-1.5">
              <Label for="profile-bio">Bio</Label>
              <Input id="profile-bio" defaultValue="Designer de sistemas em São Paulo" />
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

export const MediaPreview: Story = {
  parameters: {
    docs: {
      description: { story: 'Pré-visualização de mídia em destaque sem footer (uso passivo).' },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <Dialog default-open>
        <DialogContent class="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Pré-visualização da imagem</DialogTitle>
            <DialogDescription>captura-de-tela.png · 1920×1080 · 248 KB</DialogDescription>
          </DialogHeader>
          <div class="flex items-center justify-center rounded-md border border-border bg-muted/50 aspect-video text-muted-foreground text-sm">
            Imagem em destaque
          </div>
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
