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
import { waitForPortal } from '@/lib/wait-for-portal';

const meta = {
  title: 'UI/Drawer/Variantes',
  component: Drawer,
  tags: ['disclosure'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Variantes do Drawer correspondem ao prop direction: bottom (mobile-first padrão), top, left e right. Cada direção aplica posicionamento, border e rounded-corners diferentes via data-vaul-drawer-direction.',
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

async function expectDirection(expected: string) {
  const body = within(document.body);
  const dialog = await waitForPortal('dialog');
  await expect(dialog).toBeVisible();
  const content = document.querySelector('[data-slot="drawer-content"]') as HTMLElement | null;
  await expect(content).not.toBeNull();
  await expect(content).toHaveAttribute('data-vaul-drawer-direction', expected);
}

export const Bottom: Story = {
  parameters: {
    docs: { description: { story: 'direction=bottom — drawer mobile padrão com handle de drag visível, rounded-t-xl.' } },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout">
        <Drawer :default-open="true" direction="bottom">
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Detalhes do pedido</DrawerTitle>
              <DrawerDescription>Pedido #4287 confirmado em 15 de março.</DrawerDescription>
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
    await expectDirection('bottom');
  },
};

export const Top: Story = {
  parameters: {
    docs: { description: { story: 'direction=top — entra de cima, rounded-b-xl. Útil para notificações ou seletores rápidos.' } },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout">
        <Drawer :default-open="true" direction="top">
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Nova versão disponível</DrawerTitle>
              <DrawerDescription>Atualize agora para acessar as novidades.</DrawerDescription>
            </DrawerHeader>
            <DrawerFooter>
              <Button>Atualizar</Button>
              <DrawerClose as-child>
                <Button variant="outline">Mais tarde</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </div>
    `,
  }),
  play: async () => {
    await expectDirection('top');
  },
};

export const Left: Story = {
  parameters: {
    docs: { description: { story: 'direction=left — painel lateral à esquerda; w-3/4 mobile, max-w-sm desktop; rounded-r-xl.' } },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout">
        <Drawer :default-open="true" direction="left">
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Menu</DrawerTitle>
              <DrawerDescription>Navegue pelas seções do app.</DrawerDescription>
            </DrawerHeader>
            <nav class="px-4 py-2 text-sm space-y-2">
              <a href="#" class="block">Início</a>
              <a href="#" class="block">Pedidos</a>
              <a href="#" class="block">Configuracoes</a>
            </nav>
            <DrawerFooter>
              <DrawerClose as-child>
                <Button variant="outline">Fechar</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </div>
    `,
  }),
  play: async () => {
    await expectDirection('left');
  },
};

export const Right: Story = {
  parameters: {
    docs: { description: { story: 'direction=right — painel lateral à direita; padrão para edição em desktop; rounded-l-xl.' } },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout">
        <Drawer :default-open="true" direction="right">
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Filtros</DrawerTitle>
              <DrawerDescription>Refine sua busca por categoria, preço e disponibilidade.</DrawerDescription>
            </DrawerHeader>
            <DrawerFooter>
              <Button>Aplicar filtros</Button>
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
    await expectDirection('right');
  },
};
