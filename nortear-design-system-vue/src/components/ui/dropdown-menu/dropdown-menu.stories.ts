import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, userEvent, expect, fn, waitFor } from 'storybook/test';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './index';
import { Button } from '@/components/ui/button';
import DropdownMenuDocs from '@/components/docs/DropdownMenuDocs.vue';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { waitForPortal, waitForPortalGone, FOCUS_RULE_GUARDA } from '@/lib/wait-for-portal';
import { dropdownMenuSource } from './dropdown-menu.source';

const meta = {
  title: 'UI/DropdownMenu',
  component: DropdownMenu,
  tags: ['autodocs', 'overlay'],
  parameters: {
    layout: 'centered',
    a11y: { config: { rules: [FOCUS_RULE_GUARDA] } },
    docs: {
      page: withAutoDocsTab(DropdownMenuDocs),
      source: { transform: dropdownMenuSource },
      description: {
        component:
          'Menu suspenso acionado por botão. Renderiza em portal com role=menu, foco preso ' +
          'enquanto aberto e navegação por teclado. Suporta items, checkbox-items, radio-groups, ' +
          'submenus, separators, labels e shortcuts.',
      },
    },
  },
  argTypes: {
    defaultOpen: {
      control: 'boolean',
      description: 'Estado inicial em modo não-controlado.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    modal: {
      control: 'boolean',
      description: 'Bloqueia a interação com o resto da página enquanto o menu está aberto.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    'onUpdate:open': { control: false, table: { disable: true } },
  },
  args: {
    defaultOpen: false,
    modal: true,
    'onUpdate:open': fn(),
  },
} satisfies Meta<typeof DropdownMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item1',
      'functional.item3',
      'functional.item4',
      'accessibility.item1',
      'accessibility.item2',
      'accessibility.item3',
      'accessibility.item5',
    ],
  },
  render: (args) => ({
    components: {
      DropdownMenu,
      DropdownMenuContent,
      DropdownMenuGroup,
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
      <div style="contain: layout; min-height: 300px;">
        <DropdownMenu :key="String(args.defaultOpen)" v-bind="args">
          <DropdownMenuTrigger as-child>
            <Button variant="outline">Abrir menu</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom" align="start">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Conta</DropdownMenuLabel>
              <DropdownMenuItem>Perfil</DropdownMenuItem>
              <DropdownMenuItem>Configuracoes</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive">Sair</DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const gatilho = canvas.getByRole('button', { name: /Abrir menu/i });

    await step('O gatilho anuncia que abre um menu, e que está fechado', async () => {
      await expect(gatilho).toHaveAttribute('aria-haspopup', 'menu');
      await expect(gatilho).toHaveAttribute('aria-expanded', 'false');
    });

    await step('Clicar abre o menu com papel de menu e o foco entra nele', async () => {
      // Idempotente: o clique só acontece com o menu fechado, então o replay do
      // painel Interactions parte do mesmo estado da primeira rodada. Antes daqui
      // o clique era cego e a segunda rodada FECHAVA o menu que ia afirmar aberto.
      if (gatilho.getAttribute('aria-expanded') !== 'true') await userEvent.click(gatilho);

      const menu = await waitForPortal('menu');
      await expect(menu).toBeVisible();
      await expect(gatilho).toHaveAttribute('aria-expanded', 'true');
      await expect(within(menu).getAllByRole('menuitem')).toHaveLength(3);
      // O foco tem que ENTRAR no menu: se ficasse no gatilho, a seta seguinte
      // não acharia item nenhum e o menu seria inoperável por teclado.
      await waitFor(async () => {
        await expect(menu.contains(document.activeElement)).toBe(true);
      });
    });

    await step('Enter escolhe o item, fecha o menu e devolve o foco ao gatilho', async () => {
      const menu = await waitForPortal('menu');
      within(menu).getAllByRole('menuitem')[0].focus();
      await userEvent.keyboard('{Enter}');
      await waitForPortalGone('menu');
      await expect(gatilho).toHaveAttribute('aria-expanded', 'false');
      // O foco não pode cair no corpo do documento: quem navega por teclado
      // teria de percorrer a página inteira de novo para voltar ao ponto.
      await waitFor(async () => {
        await expect(document.activeElement).toBe(gatilho);
      });
    });

    await step('Escape fecha e devolve o foco ao gatilho', async () => {
      if (gatilho.getAttribute('aria-expanded') !== 'true') await userEvent.click(gatilho);
      await waitForPortal('menu');

      await userEvent.keyboard('{Escape}');
      await waitForPortalGone('menu');
      await expect(gatilho).toHaveAttribute('aria-expanded', 'false');
      await waitFor(async () => {
        await expect(document.activeElement).toBe(gatilho);
      });
    });
  },
};
