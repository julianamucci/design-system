import type { Meta, StoryObj } from '@storybook/vue3';
import { within, expect } from 'storybook/test';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { waitForPortal } from '@/lib/wait-for-portal';

const meta = {
  title: 'UI/Sheet/Composicoes',
  component: Sheet,
  tags: ['disclosure'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Composicoes canônicas de uso real do Sheet: filtros avançados, edição de perfil, navegação secundária e formulário longo com scroll.',
      },
    },
  },
  decorators: [
    () => ({
      template: '<div style="min-height: 520px; width: 100%;"><story /></div>',
    }),
  ],
} satisfies Meta<typeof Sheet>;

export default meta;
type Story = StoryObj<typeof meta>;

const sharedComponents = {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Button,
  Input,
  Label,
};

export const AdvancedFilters: Story = {
  parameters: {
    docs: {
      description: { story: 'Painel direito com filtros avançados — caso de uso clássico em desktop.' },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <Sheet default-open :modal="false">
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Filtros avançados</SheetTitle>
            <SheetDescription>Configure os filtros para refinar os resultados.</SheetDescription>
          </SheetHeader>
          <div class="grid gap-4 px-4">
            <div class="grid gap-1.5">
              <Label for="cat">Categoria</Label>
              <Input id="cat" defaultValue="Componentes" />
            </div>
            <div class="grid gap-1.5">
              <Label for="status">Status</Label>
              <Input id="status" defaultValue="Estável" />
            </div>
            <div class="grid gap-1.5">
              <Label for="lang">Idioma</Label>
              <Input id="lang" defaultValue="Português" />
            </div>
          </div>
          <SheetFooter>
            <SheetClose as-child>
              <Button variant="outline">Cancelar</Button>
            </SheetClose>
            <Button>Aplicar filtros</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    `,
  }),
  play: async () => {
    const body = within(document.body);
    const dialog = await waitForPortal('dialog');
    await expect(dialog).toBeVisible();
    const apply = await body.findByRole('button', { name: /Aplicar filtros/i });
    await expect(apply).toBeVisible();
  },
};

export const ProfileEdit: Story = {
  parameters: {
    docs: {
      description: { story: 'Edição de perfil com múltiplos campos no painel direito.' },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <Sheet default-open :modal="false">
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Editar perfil</SheetTitle>
            <SheetDescription>Atualize suas informações pessoais. As mudanças são salvas ao confirmar.</SheetDescription>
          </SheetHeader>
          <form class="grid gap-3 px-4">
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
          <SheetFooter>
            <SheetClose as-child>
              <Button variant="outline">Cancelar</Button>
            </SheetClose>
            <Button type="submit">Salvar alterações</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
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

export const SecondaryNavigation: Story = {
  parameters: {
    docs: {
      description: { story: 'Menu de navegação secundária no painel esquerdo.' },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <Sheet default-open :modal="false">
        <SheetContent side="left">
          <SheetHeader>
            <SheetTitle>Navegação</SheetTitle>
            <SheetDescription>Acesse as seções principais da aplicação.</SheetDescription>
          </SheetHeader>
          <nav class="flex flex-col gap-1 px-4">
            <a href="#" class="rounded-md px-3 py-2 text-sm hover:bg-muted">Dashboard</a>
            <a href="#" class="rounded-md px-3 py-2 text-sm hover:bg-muted">Componentes</a>
            <a href="#" class="rounded-md px-3 py-2 text-sm hover:bg-muted">Tokens</a>
            <a href="#" class="rounded-md px-3 py-2 text-sm hover:bg-muted">Documentação</a>
            <a href="#" class="rounded-md px-3 py-2 text-sm hover:bg-muted">Configuracoes</a>
          </nav>
        </SheetContent>
      </Sheet>
    `,
  }),
  play: async () => {
    const body = within(document.body);
    const dialog = await waitForPortal('dialog');
    await expect(dialog).toBeVisible();
    const content = document.querySelector<HTMLElement>('[data-slot="sheet-content"]');
    await expect(content).toHaveAttribute('data-side', 'left');
  },
};

export const LongFormScroll: Story = {
  parameters: {
    docs: {
      description: { story: 'Formulário longo com scroll interno — Header/Footer fixos enquanto o body rola.' },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <Sheet default-open :modal="false">
        <SheetContent side="right" class="flex flex-col">
          <SheetHeader>
            <SheetTitle>Preferências de notificação</SheetTitle>
            <SheetDescription>Configure cada tipo de notificação individualmente.</SheetDescription>
          </SheetHeader>
          <div class="flex-1 overflow-y-auto px-4">
            <div class="grid gap-3 py-2">
              <div v-for="i in 12" :key="i" class="grid gap-1.5">
                <Label :for="'notif-' + i">Categoria {{ i }}</Label>
                <Input :id="'notif-' + i" :defaultValue="'Configuração ' + i" />
              </div>
            </div>
          </div>
          <SheetFooter>
            <SheetClose as-child>
              <Button variant="outline">Cancelar</Button>
            </SheetClose>
            <Button>Salvar preferências</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    `,
  }),
  play: async () => {
    const body = within(document.body);
    const dialog = await waitForPortal('dialog');
    await expect(dialog).toBeVisible();
    const save = await body.findByRole('button', { name: /Salvar preferências/i });
    await expect(save).toBeVisible();
  },
};
