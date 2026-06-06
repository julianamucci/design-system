import type { Meta, StoryObj } from '@storybook/vue3';
import { fn, userEvent, within, expect } from 'storybook/test';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import ContextMenuDocs from '@/components/docs/ContextMenuDocs.vue';
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
} from '@/components/ui/context-menu';

const meta = {
  title: 'UI/ContextMenu',
  component: ContextMenu,
  tags: ['autodocs', 'overlay'],
  parameters: {
    layout: 'centered',
    docs: {
      page: withAutoDocsTab(ContextMenuDocs),
    },
  },
  argTypes: {
    modal: {
      control: 'boolean',
      description: 'Quando true, interações fora do menu são bloqueadas enquanto ele está aberto.',
    },
  },
  args: {
    modal: true,
  },
} satisfies Meta<typeof ContextMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    modal: true,
  },
  render: (args) => ({
    components: {
      ContextMenu,
      ContextMenuTrigger,
      ContextMenuContent,
      ContextMenuGroup,
      ContextMenuItem,
      ContextMenuSeparator,
      ContextMenuShortcut,
    },
    setup() {
      return { args };
    },
    template: `
      <ContextMenu v-bind="args">
        <ContextMenuTrigger class="flex h-(--height-default) w-64 items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground select-none cursor-default">
          Clique com o botão direito aqui
        </ContextMenuTrigger>
        <ContextMenuContent class="w-52">
          <ContextMenuGroup>
            <ContextMenuItem>
              Editar
              <ContextMenuShortcut>⌘E</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem>
              Duplicar
            </ContextMenuItem>
            <ContextMenuItem>
              Compartilhar
            </ContextMenuItem>
          </ContextMenuGroup>
          <ContextMenuSeparator />
          <ContextMenuItem variant="destructive">
            Excluir
            <ContextMenuShortcut>⌫</ContextMenuShortcut>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('trigger renderizado corretamente', async () => {
      const trigger = canvas.getByText('Clique com o botão direito aqui');
      await expect(trigger).toBeInTheDocument();
    });

    await step('right-click abre o menu', async () => {
      const trigger = canvas.getByText('Clique com o botão direito aqui');
      await userEvent.pointer({ target: trigger, keys: '[MouseRight]' });
    });
  },
};

export const ItemDefault: Story = {
  name: 'Item Default',
  render: () => ({
    components: {
      ContextMenu,
      ContextMenuTrigger,
      ContextMenuContent,
      ContextMenuItem,
      ContextMenuShortcut,
    },
    setup() {},
    template: `
      <ContextMenu>
        <ContextMenuTrigger class="flex h-(--height-default) w-64 items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground select-none cursor-default">
          Clique com o botão direito aqui
        </ContextMenuTrigger>
        <ContextMenuContent class="w-52">
          <ContextMenuItem>
            Editar
            <ContextMenuShortcut>⌘E</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem>Duplicar</ContextMenuItem>
          <ContextMenuItem>Compartilhar</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    `,
  }),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.firstElementChild).toBeTruthy();
  },
};

export const ItemDestructive: Story = {
  name: 'Item Destructive',
  render: () => ({
    components: {
      ContextMenu,
      ContextMenuTrigger,
      ContextMenuContent,
      ContextMenuItem,
      ContextMenuSeparator,
      ContextMenuShortcut,
    },
    setup() {},
    template: `
      <ContextMenu>
        <ContextMenuTrigger class="flex h-(--height-default) w-64 items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground select-none cursor-default">
          Clique com o botão direito aqui
        </ContextMenuTrigger>
        <ContextMenuContent class="w-52">
          <ContextMenuItem>
            Editar
            <ContextMenuShortcut>⌘E</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem>Duplicar</ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem variant="destructive">
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

    await step('right-click abre o menu com item destrutivo', async () => {
      const trigger = canvas.getByText('Clique com o botão direito aqui');
      await userEvent.pointer({ target: trigger, keys: '[MouseRight]' });
    });
  },
};
