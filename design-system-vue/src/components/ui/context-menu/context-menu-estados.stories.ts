import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, userEvent, expect } from 'storybook/test';
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuLabel,
} from '@/components/ui/context-menu';

const meta = {
  title: 'UI/ContextMenu/Estados',
  component: ContextMenu,
  tags: ['overlay'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      description: {
        component:
          'Estados do Context Menu: item desabilitado, item com inset e variante destrutiva.',
      },
    },
  },
} satisfies Meta<typeof ContextMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ItemDisabled: Story = {
  name: 'Item Disabled',
  render: () => ({
    components: {
      ContextMenu,
      ContextMenuTrigger,
      ContextMenuContent,
      ContextMenuGroup,
      ContextMenuItem,
      ContextMenuSeparator,
      ContextMenuShortcut,
    },
    setup() {},
    template: `
      <ContextMenu>
        <ContextMenuTrigger class="nds-cluster nds-rounded-lg nds-border-default border-dashed nds-text-body nds-text-muted-foreground cursor-default" style="user-select: none; height: var(--height-default); width: 16rem"  data-align="center" data-justify="center" >
          Clique com o botão direito aqui
        </ContextMenuTrigger>
        <ContextMenuContent class="" style="width: 13rem">
          <ContextMenuGroup>
            <ContextMenuItem>
              Editar
              <ContextMenuShortcut>⌘E</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem disabled>
              Duplicar
            </ContextMenuItem>
            <ContextMenuItem disabled>
              Compartilhar
            </ContextMenuItem>
          </ContextMenuGroup>
          <ContextMenuSeparator />
          <ContextMenuItem variant="destructive" disabled>
            Excluir
            <ContextMenuShortcut>⌫</ContextMenuShortcut>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('trigger renderizado', async () => {
      const trigger = canvas.getByText('Clique com o botão direito aqui');
      await expect(trigger).toBeInTheDocument();
    });

    await step('right-click abre menu com itens desabilitados', async () => {
      const trigger = canvas.getByText('Clique com o botão direito aqui');
      await userEvent.pointer({ target: trigger, keys: '[MouseRight]' });
    });
  },
};

export const ItemInset: Story = {
  name: 'Item com Inset',
  render: () => ({
    components: {
      ContextMenu,
      ContextMenuTrigger,
      ContextMenuContent,
      ContextMenuGroup,
      ContextMenuLabel,
      ContextMenuItem,
      ContextMenuSeparator,
    },
    setup() {},
    template: `
      <ContextMenu>
        <ContextMenuTrigger class="nds-cluster nds-rounded-lg nds-border-default border-dashed nds-text-body nds-text-muted-foreground cursor-default" style="user-select: none; height: var(--height-default); width: 16rem"  data-align="center" data-justify="center" >
          Clique com o botão direito aqui
        </ContextMenuTrigger>
        <ContextMenuContent class="" style="width: 13rem">
          <ContextMenuLabel inset>Arquivo</ContextMenuLabel>
          <ContextMenuSeparator />
          <ContextMenuGroup>
            <ContextMenuItem inset>Editar</ContextMenuItem>
            <ContextMenuItem inset>Duplicar</ContextMenuItem>
            <ContextMenuItem inset>Compartilhar</ContextMenuItem>
          </ContextMenuGroup>
          <ContextMenuSeparator />
          <ContextMenuItem inset variant="destructive">Excluir</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    `,
  }),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.firstElementChild).toBeTruthy();
  },
};

export const ItemDestructiveIsolado: Story = {
  name: 'Item Destructive',
  render: () => ({
    components: {
      ContextMenu,
      ContextMenuTrigger,
      ContextMenuContent,
      ContextMenuGroup,
      ContextMenuItem,
      ContextMenuSeparator,
      ContextMenuShortcut,
    },
    setup() {},
    template: `
      <ContextMenu>
        <ContextMenuTrigger class="nds-cluster nds-rounded-lg nds-border-default border-dashed nds-text-body nds-text-muted-foreground cursor-default" style="user-select: none; height: var(--height-default); width: 16rem"  data-align="center" data-justify="center" >
          Clique com o botão direito aqui
        </ContextMenuTrigger>
        <ContextMenuContent class="" style="width: 13rem">
          <ContextMenuGroup>
            <ContextMenuItem>Editar</ContextMenuItem>
            <ContextMenuItem>Duplicar</ContextMenuItem>
          </ContextMenuGroup>
          <ContextMenuSeparator />
          <ContextMenuItem variant="destructive">
            Excluir permanentemente
            <ContextMenuShortcut>⌫</ContextMenuShortcut>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('trigger presente na tela', async () => {
      const trigger = canvas.getByText('Clique com o botão direito aqui');
      await expect(trigger).toBeInTheDocument();
    });

    await step('right-click exibe o item destrutivo', async () => {
      const trigger = canvas.getByText('Clique com o botão direito aqui');
      await userEvent.pointer({ target: trigger, keys: '[MouseRight]' });
    });
  },
};
