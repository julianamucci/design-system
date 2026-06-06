import type { Meta, StoryObj } from '@storybook/vue3';
import { within, expect } from 'storybook/test';
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
} from './index';
import { waitForPortal } from '@/lib/wait-for-portal';

const meta = {
  title: 'UI/Menubar/Variantes',
  component: Menubar,
  tags: ['navigation'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Variantes do MenubarItem: default (item neutro com hover bg-accent) e destructive (text-destructive + bg-destructive/10 no hover) para ações irreversíveis.',
      },
    },
  },
} satisfies Meta<typeof Menubar>;

export default meta;
type Story = StoryObj<typeof meta>;

const sharedComponents = {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
};

export const Default: Story = {
  parameters: {
    docs: { description: { story: 'Item neutro padrão — hover/foco aplicam bg-accent.' } },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout; min-height: 240px;">
        <Menubar default-value="file">
          <MenubarMenu value="file">
            <MenubarTrigger>Arquivo</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>Novo</MenubarItem>
              <MenubarItem>Abrir</MenubarItem>
              <MenubarItem>Salvar</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      </div>
    `,
  }),
  play: async () => {
    const body = within(document.body);
    const menu = await waitForPortal('menu');
    await expect(menu).toBeVisible();
    const items = await body.findAllByRole('menuitem');
    // 1 trigger + 3 items
    await expect(items.length).toBeGreaterThanOrEqual(3);
  },
};

export const Destructive: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Item destrutivo — text-destructive e fundo bg-destructive/10 no hover. Usar apenas para ações irreversíveis (excluir, sair).',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout; min-height: 240px;">
        <Menubar default-value="file">
          <MenubarMenu value="file">
            <MenubarTrigger>Arquivo</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>Salvar</MenubarItem>
              <MenubarSeparator />
              <MenubarItem variant="destructive">Excluir arquivo</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      </div>
    `,
  }),
  play: async () => {
    const body = within(document.body);
    const menu = await waitForPortal('menu');
    await expect(menu).toBeVisible();
    const destructive = await waitForPortal('menuitem', { name: /Excluir arquivo/i });
    await expect(destructive).toHaveAttribute('data-variant', 'destructive');
  },
};
