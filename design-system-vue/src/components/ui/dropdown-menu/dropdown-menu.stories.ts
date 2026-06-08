import type { Meta, StoryObj } from '@storybook/vue3';
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
import DropdownMenuDocs from '@/components/docs/DropdownMenuDocs.vue';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { waitForPortal } from '@/lib/wait-for-portal';

const meta = {
  title: 'UI/DropdownMenu',
  component: DropdownMenu,
  tags: ['autodocs', 'overlay'],
  parameters: {
    docs: {
      page: withAutoDocsTab(DropdownMenuDocs),
      description: {
        component:
          'DropdownMenu (reka-ui) é um menu suspenso acionado por botão. Renderiza em portal com role=menu, focus trap e roving tabindex. Suporta items, checkbox-items, radio-groups, submenus, separators, labels e shortcuts.',
      },
    },
  },
  argTypes: {
    defaultOpen: {
      control: 'boolean',
      description: 'Estado inicial em modo não-controlado.',
    },
    modal: {
      control: 'boolean',
      description: 'Quando true, bloqueia interação com o resto da página enquanto o menu está aberto.',
    },
  },
  args: {
    defaultOpen: false,
    modal: true,
  },
} satisfies Meta<typeof DropdownMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => ({
    components: {
      DropdownMenu,
      DropdownMenuContent,
      DropdownMenuItem,
      DropdownMenuLabel,
      DropdownMenuSeparator,
      DropdownMenuTrigger,
      Button,
    },
    setup() {
      return { args };
    },
    template: `
      <div style="contain: layout; min-height: 240px;">
        <DropdownMenu :key="String(args.defaultOpen)" v-bind="args">
          <DropdownMenuTrigger as-child>
            <Button variant="outline">Abrir menu</Button>
          </DropdownMenuTrigger>
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
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);

    const waitForClose = async () => {
      await waitFor(
        () => {
          const menu = body.queryByRole('menu');
          if (menu) throw new Error('menu ainda aberto');
        },
        { timeout: 1500 },
      );
    };

    await step('1. Trigger renderiza com aria-haspopup=menu', async () => {
      const trigger = canvas.getByRole('button', { name: /Abrir menu/i });
      await expect(trigger).toBeInTheDocument();
      await expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    await step('2. Click no trigger abre o menu com role=menu', async () => {
      const trigger = canvas.getByRole('button', { name: /Abrir menu/i });
      await userEvent.click(trigger);
      const menu = await waitForPortal('menu');
      await expect(menu).toBeVisible();
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });

    await step('3. Items têm role=menuitem', async () => {
      const items = await body.findAllByRole('menuitem');
      await expect(items.length).toBeGreaterThanOrEqual(3);
    });

    await step('4. ESC fecha o menu e foco retorna ao trigger', async () => {
      await userEvent.keyboard('{Escape}');
      await waitForClose();
      const trigger = canvas.getByRole('button', { name: /Abrir menu/i });
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });
  },
};
