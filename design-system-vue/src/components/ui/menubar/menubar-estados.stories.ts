import type { Meta, StoryObj } from '@storybook/vue3';
import { within, expect } from 'storybook/test';
import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
} from './index';
import { waitForPortal } from '@/lib/wait-for-portal';

const meta = {
  title: 'UI/Menubar/Estados',
  component: Menubar,
  tags: ['navigation'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Estados canônicos do Menubar: Fechado (apenas Triggers), Aberto (defaultValue), ItemDesabilitado (Item disabled) e CheckboxChecked (CheckboxItem com checked=true).',
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
  MenubarSeparator,
  MenubarTrigger,
};

export const Fechado: Story = {
  parameters: {
    docs: { description: { story: 'Estado inicial — apenas a barra com Triggers visíveis. Portal vazio.' } },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout">
        <Menubar>
          <MenubarMenu value="file">
            <MenubarTrigger>Arquivo</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>Novo</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
          <MenubarMenu value="edit">
            <MenubarTrigger>Editar</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>Desfazer</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    const menubar = canvas.getByRole('menubar');
    await expect(menubar).toBeVisible();
    await expect(body.queryByRole('menu')).not.toBeInTheDocument();
  },
};

export const Aberto: Story = {
  parameters: {
    docs: { description: { story: 'Menu Arquivo aberto via defaultValue. Captura visual no Chromatic.' } },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout; min-height: 260px;">
        <Menubar default-value="file">
          <MenubarMenu value="file">
            <MenubarTrigger>Arquivo</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>Novo</MenubarItem>
              <MenubarItem>Abrir</MenubarItem>
              <MenubarSeparator />
              <MenubarItem>Salvar</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
          <MenubarMenu value="edit">
            <MenubarTrigger>Editar</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>Desfazer</MenubarItem>
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
  },
};

export const ItemDesabilitado: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Item com prop disabled — recebe aria-disabled="true"; navegação por teclado pula o item.',
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
              <MenubarItem>Novo</MenubarItem>
              <MenubarItem disabled>Arquivar (indisponível)</MenubarItem>
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
    const disabled = await waitForPortal('menuitem', { name: /Arquivar/i });
    await expect(disabled).toHaveAttribute('aria-disabled', 'true');
  },
};

export const CheckboxChecked: Story = {
  parameters: {
    docs: {
      description: {
        story: 'CheckboxItem com checked=true — exibe ícone Check e aria-checked="true".',
      },
    },
  },
  render: () => ({
    components: sharedComponents,
    template: `
      <div style="contain: layout; min-height: 240px;">
        <Menubar default-value="view">
          <MenubarMenu value="view">
            <MenubarTrigger>Exibir</MenubarTrigger>
            <MenubarContent>
              <MenubarCheckboxItem :checked="true">Barra de status</MenubarCheckboxItem>
              <MenubarCheckboxItem :checked="false">Barra lateral</MenubarCheckboxItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      </div>
    `,
  }),
  play: async () => {
    const body = within(document.body);
    const checkboxes = await body.findAllByRole('menuitemcheckbox');
    await expect(checkboxes.length).toBe(2);
    await expect(checkboxes[0]).toHaveAttribute('aria-checked', 'true');
    await expect(checkboxes[1]).toHaveAttribute('aria-checked', 'false');
  },
};
