import type { Meta, StoryObj } from '@storybook/vue3';
import { userEvent, within, expect, waitFor } from 'storybook/test';
import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from './index';
import MenubarDocs from '@/components/docs/MenubarDocs.vue';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { waitForPortal } from '@/lib/wait-for-portal';

const meta = {
  title: 'UI/Menubar',
  component: Menubar,
  tags: ['autodocs', 'navigation'],
  parameters: {
    docs: {
      page: withAutoDocsTab(MenubarDocs),
      description: {
        component:
          'Menubar (reka-ui) é uma barra horizontal com múltiplos menus suspensos no estilo de aplicações desktop. Coordena foco entre menus via setas Esquerda/Direita; setas Cima/Baixo navegam Items; suporta submenus, checkbox-items, radio-groups, separators e shortcuts.',
      },
    },
  },
  argTypes: {
    defaultValue: {
      control: 'text',
      description: 'Menu ativo inicial em modo não-controlado (use o value de cada MenubarMenu).',
    },
    loop: {
      control: 'boolean',
      description: 'Loop de navegação por setas — do último para o primeiro Trigger e vice-versa.',
    },
  },
  args: {
    defaultValue: '',
    loop: true,
  },
} satisfies Meta<typeof Menubar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => ({
    components: {
      Menubar,
      MenubarCheckboxItem,
      MenubarContent,
      MenubarItem,
      MenubarMenu,
      MenubarRadioGroup,
      MenubarRadioItem,
      MenubarSeparator,
      MenubarShortcut,
      MenubarSub,
      MenubarSubContent,
      MenubarSubTrigger,
      MenubarTrigger,
    },
    setup() {
      return { args };
    },
    template: `
      <div style="contain: layout; min-height: 300px;">
        <Menubar :key="String(args.defaultValue) + String(args.loop)" v-bind="args">
          <MenubarMenu value="file">
            <MenubarTrigger>Arquivo</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>Novo <MenubarShortcut>⌘N</MenubarShortcut></MenubarItem>
              <MenubarItem>Abrir <MenubarShortcut>⌘O</MenubarShortcut></MenubarItem>
              <MenubarSeparator />
              <MenubarSub>
                <MenubarSubTrigger>Exportar</MenubarSubTrigger>
                <MenubarSubContent>
                  <MenubarItem>PDF</MenubarItem>
                  <MenubarItem>CSV</MenubarItem>
                  <MenubarItem>JSON</MenubarItem>
                </MenubarSubContent>
              </MenubarSub>
              <MenubarSeparator />
              <MenubarItem variant="destructive">Excluir arquivo</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
          <MenubarMenu value="edit">
            <MenubarTrigger>Editar</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>Desfazer <MenubarShortcut>⌘Z</MenubarShortcut></MenubarItem>
              <MenubarItem>Refazer <MenubarShortcut>⇧⌘Z</MenubarShortcut></MenubarItem>
              <MenubarSeparator />
              <MenubarItem>Recortar <MenubarShortcut>⌘X</MenubarShortcut></MenubarItem>
              <MenubarItem>Copiar <MenubarShortcut>⌘C</MenubarShortcut></MenubarItem>
              <MenubarItem>Colar <MenubarShortcut>⌘V</MenubarShortcut></MenubarItem>
            </MenubarContent>
          </MenubarMenu>
          <MenubarMenu value="view">
            <MenubarTrigger>Exibir</MenubarTrigger>
            <MenubarContent>
              <MenubarCheckboxItem :checked="true">Barra de status</MenubarCheckboxItem>
              <MenubarCheckboxItem :checked="false">Barra lateral</MenubarCheckboxItem>
              <MenubarSeparator />
              <MenubarItem>Tela cheia <MenubarShortcut>⌃⌘F</MenubarShortcut></MenubarItem>
            </MenubarContent>
          </MenubarMenu>
          <MenubarMenu value="tools">
            <MenubarTrigger>Ferramentas</MenubarTrigger>
            <MenubarContent>
              <MenubarRadioGroup model-value="grid">
                <MenubarRadioItem value="list">Lista</MenubarRadioItem>
                <MenubarRadioItem value="grid">Grid</MenubarRadioItem>
                <MenubarRadioItem value="kanban">Kanban</MenubarRadioItem>
              </MenubarRadioGroup>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
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

    await step('1. Menubar tem role=menubar com 4 Triggers', async () => {
      const menubar = canvas.getByRole('menubar');
      await expect(menubar).toBeInTheDocument();
      const triggers = canvas.getAllByRole('menuitem');
      await expect(triggers.length).toBe(4);
    });

    await step('2. Trigger tem aria-haspopup=menu', async () => {
      const trigger = canvas.getByRole('menuitem', { name: /Arquivo/i });
      await expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    await step('3. Click no Trigger abre Content', async () => {
      const trigger = canvas.getByRole('menuitem', { name: /Arquivo/i });
      await userEvent.click(trigger);
      const menu = await waitForPortal('menu');
      await expect(menu).toBeVisible();
    });

    await step('4. ESC fecha o menu', async () => {
      await userEvent.keyboard('{Escape}');
      await waitForClose();
    });
  },
};
