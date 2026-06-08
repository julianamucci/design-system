import type { Meta, StoryObj } from '@storybook/vue3';
import { ref } from 'vue';
import { userEvent, within, expect, waitFor } from 'storybook/test';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './index';
import { Button } from '@/components/ui/button';
import { waitForPortal } from '@/lib/wait-for-portal';

const meta = {
  title: 'UI/DropdownMenu/Estados',
  component: DropdownMenu,
  tags: ['overlay'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Estados canônicos do DropdownMenu: Fechado (apenas trigger), Aberto (defaultOpen), Controlado (open + @update:open) e ItemDesabilitado (Item disabled).',
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
  DropdownMenuTrigger,
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
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="outline">Abrir menu</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Perfil</DropdownMenuItem>
            <DropdownMenuItem>Sair</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    const trigger = canvas.getByRole('button', { name: /Abrir menu/i });
    await expect(trigger).toBeVisible();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(body.queryByRole('menu')).not.toBeInTheDocument();
  },
};

export const Aberto: Story = {
  parameters: {
    docs: { description: { story: 'Menu aberto via defaultOpen. Captura visual no Chromatic.' } },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout; min-height: 220px;">
        <DropdownMenu :default-open="true" :modal="false">
          <DropdownMenuContent side="bottom" align="start">
            <DropdownMenuLabel>Conta</DropdownMenuLabel>
            <DropdownMenuItem>Perfil</DropdownMenuItem>
            <DropdownMenuItem>Configuracoes</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">Sair</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    `,
  }),
  play: async () => {
    const body = within(document.body);
    const menu = await waitForPortal('menu');
    await expect(menu).toBeVisible();
  },
};

export const Controlado: Story = {
  parameters: {
    docs: { description: { story: 'Abertura controlada por estado externo via open + @update:open.' } },
  },
  render: () => ({
    components: sharedComponents,
    setup() {
      const open = ref(false);
      return { open };
    },
    template: `
      <div class="flex flex-col gap-3" style="contain: layout; min-height: 240px;">
        <Button @click="open = !open">Toggle externo ({{ open ? 'aberto' : 'fechado' }})</Button>
        <DropdownMenu :open="open" @update:open="(v) => open = v" :modal="false">
          <DropdownMenuTrigger as-child>
            <Button variant="outline">Trigger interno</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom" align="start">
            <DropdownMenuItem>Item A</DropdownMenuItem>
            <DropdownMenuItem>Item B</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);

    await step('Click no toggle externo abre o menu', async () => {
      const toggle = canvas.getByRole('button', { name: /Toggle externo/i });
      await userEvent.click(toggle);
      const menu = await waitForPortal('menu');
      await expect(menu).toBeVisible();
    });

    await step('Escape fecha o menu controlado', async () => {
      await userEvent.keyboard('{Escape}');
      await waitFor(
        () => {
          if (body.queryByRole('menu')) throw new Error('menu ainda aberto');
        },
        { timeout: 1500 },
      );
    });
  },
};

export const ItemDesabilitado: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Item com prop disabled — recebe aria-disabled="true" e cursor not-allowed; navegação por teclado pula o item.',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout; min-height: 220px;">
        <DropdownMenu :default-open="true" :modal="false">
          <DropdownMenuContent side="bottom" align="start">
            <DropdownMenuItem>Editar</DropdownMenuItem>
            <DropdownMenuItem disabled>Arquivar (indisponível)</DropdownMenuItem>
            <DropdownMenuItem>Duplicar</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    `,
  }),
  play: async () => {
    const body = within(document.body);
    const menu = await waitForPortal('menu');
    await expect(menu).toBeVisible();
    const disabled = await waitForPortal('menuitem', { name: /Arquivar/i });
    await expect(disabled).toHaveAttribute('aria-disabled', 'true');
  },
};
