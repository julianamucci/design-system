import type { Meta, StoryObj } from '@storybook/vue3';
import { ref } from 'vue';
import { within, expect } from 'storybook/test';
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
import { waitForPortal } from '@/lib/wait-for-portal';

const meta = {
  title: 'UI/Menubar/Composicoes',
  component: Menubar,
  tags: ['navigation'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Composicoes reais de Menubar: ComShortcuts (atalhos visuais), ComSubmenu (hierarquia), ComCheckboxItems (toggles), ComRadioGroup (seleção única) e EditorCompleto (4 menus juntos).',
      },
    },
  },
} satisfies Meta<typeof Menubar>;

export default meta;
type Story = StoryObj<typeof meta>;

const sharedComponents = {
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
};

export const ComShortcuts: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'MenubarShortcut exibe atalhos visuais alinhados à direita. O atalho real precisa ser registrado pelo consumidor (useHotkeys/tinykeys).',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout; min-height: 280px;">
        <Menubar default-value="edit">
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
        </Menubar>
      </div>
    `,
  }),
  play: async () => {
    const body = within(document.body);
    const menu = await waitForPortal('menu');
    await expect(menu).toBeVisible();
    await expect(body.getByText('⌘Z')).toBeVisible();
    await expect(body.getByText('⌘C')).toBeVisible();
  },
};

export const ComSubmenu: Story = {
  parameters: {
    docs: { description: { story: 'Submenu aninhado dentro de Content — limite a 1 nível para evitar confusão de navegação.' } },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout; min-height: 300px;">
        <Menubar default-value="file">
          <MenubarMenu value="file">
            <MenubarTrigger>Arquivo</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>Novo</MenubarItem>
              <MenubarItem>Abrir</MenubarItem>
              <MenubarSeparator />
              <MenubarSub>
                <MenubarSubTrigger>Exportar como</MenubarSubTrigger>
                <MenubarSubContent>
                  <MenubarItem>PDF</MenubarItem>
                  <MenubarItem>CSV</MenubarItem>
                  <MenubarItem>JSON</MenubarItem>
                </MenubarSubContent>
              </MenubarSub>
              <MenubarSeparator />
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
    const subTrigger = await waitForPortal('menuitem', { name: /Exportar como/i });
    await expect(subTrigger).toHaveAttribute('aria-haspopup', 'menu');
  },
};

export const ComCheckboxItems: Story = {
  parameters: {
    docs: { description: { story: 'CheckboxItems para toggles independentes (mostrar/ocultar barras).' } },
  },
  render: () => ({
    components: sharedComponents,
    setup() {
      const showStatus = ref(true);
      const showSidebar = ref(false);
      const showPanel = ref(true);
      return { showStatus, showSidebar, showPanel };
    },
    template: `
      <div style="contain: layout; min-height: 280px;">
        <Menubar default-value="view">
          <MenubarMenu value="view">
            <MenubarTrigger>Exibir</MenubarTrigger>
            <MenubarContent>
              <MenubarCheckboxItem :checked="showStatus" @update:checked="(v) => showStatus = v">Barra de status</MenubarCheckboxItem>
              <MenubarCheckboxItem :checked="showSidebar" @update:checked="(v) => showSidebar = v">Barra lateral</MenubarCheckboxItem>
              <MenubarCheckboxItem :checked="showPanel" @update:checked="(v) => showPanel = v">Painel inferior</MenubarCheckboxItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      </div>
    `,
  }),
  play: async () => {
    const body = within(document.body);
    const checkboxes = await body.findAllByRole('menuitemcheckbox');
    await expect(checkboxes.length).toBe(3);
    await expect(checkboxes[0]).toHaveAttribute('aria-checked', 'true');
    await expect(checkboxes[1]).toHaveAttribute('aria-checked', 'false');
  },
};

export const ComRadioGroup: Story = {
  parameters: {
    docs: { description: { story: 'RadioGroup para seleção única dentro do Menubar (visualização lista/grid/kanban).' } },
  },
  render: () => ({
    components: sharedComponents,
    setup() {
      const view = ref('grid');
      return { view };
    },
    template: `
      <div style="contain: layout; min-height: 280px;">
        <Menubar default-value="tools">
          <MenubarMenu value="tools">
            <MenubarTrigger>Ferramentas</MenubarTrigger>
            <MenubarContent>
              <MenubarRadioGroup :model-value="view" @update:model-value="(v) => view = v">
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
  play: async () => {
    const body = within(document.body);
    const radios = await body.findAllByRole('menuitemradio');
    await expect(radios.length).toBe(3);
    await expect(radios[1]).toHaveAttribute('aria-checked', 'true');
  },
};

export const EditorCompleto: Story = {
  parameters: {
    docs: { description: { story: 'Menubar completo de um editor: 4 menus (Arquivo, Editar, Exibir, Ferramentas) — cenário canônico.' } },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout; min-height: 320px;">
        <Menubar>
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
            </MenubarContent>
          </MenubarMenu>
          <MenubarMenu value="view">
            <MenubarTrigger>Exibir</MenubarTrigger>
            <MenubarContent>
              <MenubarCheckboxItem :checked="true">Barra de status</MenubarCheckboxItem>
              <MenubarCheckboxItem :checked="false">Barra lateral</MenubarCheckboxItem>
            </MenubarContent>
          </MenubarMenu>
          <MenubarMenu value="tools">
            <MenubarTrigger>Ferramentas</MenubarTrigger>
            <MenubarContent>
              <MenubarRadioGroup model-value="grid">
                <MenubarRadioItem value="list">Lista</MenubarRadioItem>
                <MenubarRadioItem value="grid">Grid</MenubarRadioItem>
              </MenubarRadioGroup>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const menubar = canvas.getByRole('menubar');
    await expect(menubar).toBeVisible();
    const triggers = canvas.getAllByRole('menuitem');
    await expect(triggers.length).toBe(4);
  },
};
