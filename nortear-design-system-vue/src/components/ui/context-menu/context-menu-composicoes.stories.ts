import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, userEvent, expect } from 'storybook/test';
import { ref } from 'vue';
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
  ContextMenuSeparator,
  ContextMenuLabel,
  ContextMenuShortcut,
} from '@/components/ui/context-menu';

const meta = {
  title: 'UI/ContextMenu/Compositions',
  component: ContextMenu,
  tags: ['overlay'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      description: {
        component:
          'Composicoes avançadas do Context Menu: checkbox, radio group, submenu e shortcuts.',
      },
    },
  },
} satisfies Meta<typeof ContextMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithCheckbox: Story = {
  name: 'With CheckboxItem',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('trigger renderizado', async () => {
      const trigger = canvas.getByText('Clique com o botão direito aqui');
      await expect(trigger).toBeInTheDocument();
    });
    await step('right-click abre menu com checkboxes', async () => {
      const trigger = canvas.getByText('Clique com o botão direito aqui');
      await userEvent.pointer({ target: trigger, keys: '[MouseRight]' });
    });
  },
  render: () => ({
    components: {
      ContextMenu,
      ContextMenuTrigger,
      ContextMenuContent,
      ContextMenuGroup,
      ContextMenuLabel,
      ContextMenuCheckboxItem,
      ContextMenuSeparator,
    },
    setup() {
      const showGrid = ref(true);
      const showRulers = ref(false);
      const snapToGrid = ref(true);
      return { showGrid, showRulers, snapToGrid };
    },
    template: `
      <ContextMenu>
        <ContextMenuTrigger class="nds-cluster nds-rounded-lg nds-border-default border-dashed nds-text-body nds-text-muted-foreground cursor-default" style="user-select: none; height: var(--height-default); width: 16rem"  data-align="center" data-justify="center" >
          Clique com o botão direito aqui
        </ContextMenuTrigger>
        <ContextMenuContent class="" style="width: 14rem">
          <ContextMenuLabel inset>Visualização</ContextMenuLabel>
          <ContextMenuSeparator />
          <ContextMenuGroup>
            <ContextMenuCheckboxItem :checked="showGrid" @update:checked="showGrid = $event">
              Mostrar grade
            </ContextMenuCheckboxItem>
            <ContextMenuCheckboxItem :checked="showRulers" @update:checked="showRulers = $event">
              Mostrar réguas
            </ContextMenuCheckboxItem>
            <ContextMenuCheckboxItem :checked="snapToGrid" @update:checked="snapToGrid = $event">
              Alinhar à grade
            </ContextMenuCheckboxItem>
          </ContextMenuGroup>
        </ContextMenuContent>
      </ContextMenu>
    `,
  }),
};

export const WithRadioGroup: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('trigger renderizado', async () => {
      const trigger = canvas.getByText('Clique com o botão direito aqui');
      await expect(trigger).toBeInTheDocument();
    });
    await step('right-click abre menu com radio group', async () => {
      const trigger = canvas.getByText('Clique com o botão direito aqui');
      await userEvent.pointer({ target: trigger, keys: '[MouseRight]' });
    });
  },
  render: () => ({
    components: {
      ContextMenu,
      ContextMenuTrigger,
      ContextMenuContent,
      ContextMenuGroup,
      ContextMenuLabel,
      ContextMenuRadioGroup,
      ContextMenuRadioItem,
      ContextMenuSeparator,
    },
    setup() {
      const layout = ref('grid');
      return { layout };
    },
    template: `
      <ContextMenu>
        <ContextMenuTrigger class="nds-cluster nds-rounded-lg nds-border-default border-dashed nds-text-body nds-text-muted-foreground cursor-default" style="user-select: none; height: var(--height-default); width: 16rem"  data-align="center" data-justify="center" >
          Clique com o botão direito aqui
        </ContextMenuTrigger>
        <ContextMenuContent class="" style="width: 13rem">
          <ContextMenuLabel inset>Layout</ContextMenuLabel>
          <ContextMenuSeparator />
          <ContextMenuRadioGroup :model-value="layout" @update:model-value="layout = $event">
            <ContextMenuRadioItem value="grid">Grade</ContextMenuRadioItem>
            <ContextMenuRadioItem value="list">Lista</ContextMenuRadioItem>
            <ContextMenuRadioItem value="columns">Colunas</ContextMenuRadioItem>
          </ContextMenuRadioGroup>
        </ContextMenuContent>
      </ContextMenu>
    `,
  }),
};

export const WithSubmenu: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('trigger renderizado', async () => {
      const trigger = canvas.getByText('Clique com o botão direito aqui');
      await expect(trigger).toBeInTheDocument();
    });
    await step('right-click abre menu com submenu', async () => {
      const trigger = canvas.getByText('Clique com o botão direito aqui');
      await userEvent.pointer({ target: trigger, keys: '[MouseRight]' });
    });
  },
  render: () => ({
    components: {
      ContextMenu,
      ContextMenuTrigger,
      ContextMenuContent,
      ContextMenuGroup,
      ContextMenuItem,
      ContextMenuSub,
      ContextMenuSubTrigger,
      ContextMenuSubContent,
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
            <ContextMenuItem>Duplicar</ContextMenuItem>
            <ContextMenuSub>
              <ContextMenuSubTrigger>Compartilhar</ContextMenuSubTrigger>
              <ContextMenuSubContent class="" style="width: 10rem">
                <ContextMenuItem>Por e-mail</ContextMenuItem>
                <ContextMenuItem>Por link</ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>
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
};

export const Completo: Story = {
  name: 'Complete — Checkbox + Radio + Submenu + Shortcut',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('trigger renderizado', async () => {
      const trigger = canvas.getByText('Clique com o botão direito aqui');
      await expect(trigger).toBeInTheDocument();
    });
    await step('right-click abre menu completo', async () => {
      const trigger = canvas.getByText('Clique com o botão direito aqui');
      await userEvent.pointer({ target: trigger, keys: '[MouseRight]' });
    });
  },
  render: () => ({
    components: {
      ContextMenu,
      ContextMenuTrigger,
      ContextMenuContent,
      ContextMenuGroup,
      ContextMenuLabel,
      ContextMenuItem,
      ContextMenuCheckboxItem,
      ContextMenuRadioGroup,
      ContextMenuRadioItem,
      ContextMenuSub,
      ContextMenuSubTrigger,
      ContextMenuSubContent,
      ContextMenuSeparator,
      ContextMenuShortcut,
    },
    setup() {
      const showGrid = ref(true);
      const layout = ref('grid');
      return { showGrid, layout };
    },
    template: `
      <ContextMenu>
        <ContextMenuTrigger class="nds-cluster nds-rounded-lg nds-border-default border-dashed nds-text-body nds-text-muted-foreground cursor-default" style="user-select: none; height: var(--height-default); width: 16rem"  data-align="center" data-justify="center" >
          Clique com o botão direito aqui
        </ContextMenuTrigger>
        <ContextMenuContent class="" style="width: 14rem">
          <ContextMenuGroup>
            <ContextMenuItem>
              Editar
              <ContextMenuShortcut>⌘E</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem>Duplicar</ContextMenuItem>
            <ContextMenuSub>
              <ContextMenuSubTrigger>Compartilhar</ContextMenuSubTrigger>
              <ContextMenuSubContent class="" style="width: 10rem">
                <ContextMenuItem>Por e-mail</ContextMenuItem>
                <ContextMenuItem>Por link</ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>
          </ContextMenuGroup>
          <ContextMenuSeparator />
          <ContextMenuLabel inset>Visualização</ContextMenuLabel>
          <ContextMenuCheckboxItem :checked="showGrid" @update:checked="showGrid = $event">
            Mostrar grade
          </ContextMenuCheckboxItem>
          <ContextMenuSeparator />
          <ContextMenuLabel inset>Layout</ContextMenuLabel>
          <ContextMenuRadioGroup :model-value="layout" @update:model-value="layout = $event">
            <ContextMenuRadioItem value="grid">Grade</ContextMenuRadioItem>
            <ContextMenuRadioItem value="list">Lista</ContextMenuRadioItem>
          </ContextMenuRadioGroup>
          <ContextMenuSeparator />
          <ContextMenuItem variant="destructive">
            Excluir
            <ContextMenuShortcut>⌫</ContextMenuShortcut>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    `,
  }),
};
