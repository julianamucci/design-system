import type { Meta, StoryObj } from '@storybook/vue3';
import { within, expect } from 'storybook/test';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { waitForPortal } from '@/lib/wait-for-portal';

const meta = {
  title: 'UI/Drawer/Composicoes',
  component: Drawer,
  tags: ['disclosure'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Composicoes reais do Drawer: formulário inline, confirmação destrutiva e conteúdo com scroll interno. Cada composição usa Title+Description para acessibilidade e Footer para ações primárias/secundárias.',
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
  Input,
  Label,
};

export const ComFormulario: Story = {
  parameters: {
    docs: {
      description: { story: 'Drawer com formulário inline em direction=bottom — padrão mobile-first para edição.' },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout">
        <Drawer :default-open="true" direction="bottom">
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Editar perfil</DrawerTitle>
              <DrawerDescription>Atualize seu nome e email. As mudanças entram em vigor após salvar.</DrawerDescription>
            </DrawerHeader>
            <form class="grid gap-3 px-4 pb-4">
              <div class="grid gap-1.5">
                <Label for="drawer-name">Nome</Label>
                <Input id="drawer-name" defaultValue="Juliana Mucci" />
              </div>
              <div class="grid gap-1.5">
                <Label for="drawer-email">Email</Label>
                <Input id="drawer-email" type="email" defaultValue="juliana@example.com" />
              </div>
            </form>
            <DrawerFooter>
              <Button type="submit">Salvar alterações</Button>
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
    const nameInput = await body.findByLabelText(/Nome/i);
    await expect(nameInput).toBeVisible();
    const submit = await body.findByRole('button', { name: /Salvar alterações/i });
    await expect(submit).toBeVisible();
  },
};

export const ComConfirmacao: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Drawer com ação destrutiva secundária. Para confirmações irreversíveis principais, prefira AlertDialog. Aqui a destrutividade é parte de um fluxo maior (remover item de lista).',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout">
        <Drawer :default-open="true" direction="bottom">
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Remover anexo</DrawerTitle>
              <DrawerDescription>O anexo será removido desta mensagem. Você pode adicioná-lo novamente depois.</DrawerDescription>
            </DrawerHeader>
            <DrawerFooter>
              <Button variant="destructive">Remover anexo</Button>
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
    const action = await body.findByRole('button', { name: /Remover anexo/i });
    await expect(action).toHaveClass('bg-destructive');
  },
};

export const ComScroll: Story = {
  parameters: {
    docs: {
      description: { story: 'Drawer com conteúdo longo e scroll interno; Header e Footer fixos.' },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout">
        <Drawer :default-open="true" direction="bottom">
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Termos de serviço</DrawerTitle>
              <DrawerDescription>Leia atentamente os termos antes de aceitar.</DrawerDescription>
            </DrawerHeader>
            <div tabindex="0" role="region" aria-label="Conteúdo dos termos" class="space-y-3 text-sm text-muted-foreground max-h-72 overflow-y-auto px-4">
              <p v-for="i in 12" :key="i">
                Parágrafo {{ i }} — Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
                incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation
                ullamco laboris nisi ut aliquip ex ea commodo consequat.
              </p>
            </div>
            <DrawerFooter>
              <Button>Aceitar termos</Button>
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
    const accept = await body.findByRole('button', { name: /Aceitar termos/i });
    await expect(accept).toBeVisible();
  },
};
