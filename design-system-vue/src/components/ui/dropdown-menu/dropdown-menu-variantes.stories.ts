import type { Meta, StoryObj } from '@storybook/vue3';
import { within, expect } from 'storybook/test';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from './index';
import { waitForPortal } from '@/lib/wait-for-portal';

const meta = {
  title: 'UI/DropdownMenu/Variantes',
  component: DropdownMenu,
  tags: ['overlay'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Variantes do DropdownMenuItem: default (item neutro com hover bg-accent) e destructive (text-destructive + bg-destructive/10 no hover) para ações irreversíveis.',
      },
    },
  },
} satisfies Meta<typeof DropdownMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

const sharedComponents = {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
};

export const Default: Story = {
  parameters: {
    docs: { description: { story: 'Item neutro padrão — hover/foco aplicam bg-accent.' } },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout; min-height: 220px;">
        <DropdownMenu :default-open="true" :modal="false">
          <DropdownMenuContent side="bottom" align="start">
            <DropdownMenuLabel>Ações</DropdownMenuLabel>
            <DropdownMenuItem>Editar</DropdownMenuItem>
            <DropdownMenuItem>Duplicar</DropdownMenuItem>
            <DropdownMenuItem>Compartilhar</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    `,
  }),
  play: async () => {
    const body = within(document.body);
    const menu = await waitForPortal('menu');
    await expect(menu).toBeVisible();
    const items = await body.findAllByRole('menuitem');
    await expect(items.length).toBe(3);
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
      <div style="contain: layout; min-height: 220px;">
        <DropdownMenu :default-open="true" :modal="false">
          <DropdownMenuContent side="bottom" align="start">
            <DropdownMenuLabel>Conta</DropdownMenuLabel>
            <DropdownMenuItem>Perfil</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">Excluir conta</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    `,
  }),
  play: async () => {
    const body = within(document.body);
    const menu = await waitForPortal('menu');
    await expect(menu).toBeVisible();
    const destructive = await waitForPortal('menuitem', { name: /Excluir conta/i });
    await expect(destructive).toHaveAttribute('data-variant', 'destructive');
  },
};
