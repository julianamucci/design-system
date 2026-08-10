import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import { within, userEvent, expect } from 'storybook/test';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

const meta = {
  title: 'UI/Command/Compositions',
  component: Command,
  tags: ['overlay'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      description: {
        component:
          'Composicoes do Command: com grupos, com shortcuts, como combobox em Popover e como command palette em CommandDialog.',
      },
    },
  },
} satisfies Meta<typeof Command>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithGroups: Story = {
  name: 'With groups and separator',
  render: () => ({
    components: {
      Command,
      CommandEmpty,
      CommandGroup,
      CommandInput,
      CommandItem,
      CommandList,
      CommandSeparator,
    },
    setup() {
      return {};
    },
    template: `
      <div class="rounded-xl nds-border-default shadow-md nds-overflow-hidden" style="width: 18rem">
        <Command>
          <CommandInput placeholder="Buscar componente..." />
          <CommandList>
            <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
            <CommandGroup heading="Componentes">
              <CommandItem value="button">Button</CommandItem>
              <CommandItem value="input">Input</CommandItem>
              <CommandItem value="select">Select</CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Utilitários">
              <CommandItem value="separator">Separator</CommandItem>
              <CommandItem value="badge">Badge</CommandItem>
              <CommandItem value="avatar">Avatar</CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.firstElementChild).toBeTruthy();
  },
};

export const WithShortcuts: Story = {
  render: () => ({
    components: {
      Command,
      CommandEmpty,
      CommandGroup,
      CommandInput,
      CommandItem,
      CommandList,
      CommandSeparator,
      CommandShortcut,
    },
    setup() {
      return {};
    },
    template: `
      <div class="rounded-xl nds-border-default shadow-md nds-overflow-hidden" style="width: 18rem">
        <Command>
          <CommandInput placeholder="Buscar ação..." />
          <CommandList>
            <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
            <CommandGroup heading="Ações">
              <CommandItem value="novo-arquivo">
                Novo arquivo
                <CommandShortcut>⌘N</CommandShortcut>
              </CommandItem>
              <CommandItem value="abrir">
                Abrir
                <CommandShortcut>⌘O</CommandShortcut>
              </CommandItem>
              <CommandItem value="salvar">
                Salvar
                <CommandShortcut>⌘S</CommandShortcut>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Editar">
              <CommandItem value="desfazer">
                Desfazer
                <CommandShortcut>⌘Z</CommandShortcut>
              </CommandItem>
              <CommandItem value="refazer">
                Refazer
                <CommandShortcut>⌘⇧Z</CommandShortcut>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.firstElementChild).toBeTruthy();
  },
};

export const AsCombobox: Story = {
  name: 'As combobox (in Popover)',
  render: () => ({
    components: {
      Command,
      CommandEmpty,
      CommandGroup,
      CommandInput,
      CommandItem,
      CommandList,
      Popover,
      PopoverContent,
      PopoverTrigger,
      Button,
    },
    setup() {
      const open = ref(false);
      const selectedValue = ref('');
      const items = [
        { value: 'button', label: 'Button' },
        { value: 'input', label: 'Input' },
        { value: 'select', label: 'Select' },
        { value: 'textarea', label: 'Textarea' },
        { value: 'badge', label: 'Badge' },
        { value: 'avatar', label: 'Avatar' },
      ];

      function selectItem(value: string) {
        selectedValue.value = value === selectedValue.value ? '' : value;
        open.value = false;
      }

      return { open, selectedValue, items, selectItem };
    },
    template: `
      <Popover v-model:open="open">
        <PopoverTrigger as-child>
          <Button
            variant="outline"
            role="combobox"
            aria-label="Selecionar item"
            :aria-expanded="open"
            class="" data-justify="between" style="width: 14rem"
          >
            {{ selectedValue
              ? items.find(i => i.value === selectedValue)?.label
              : 'Selecione um item...' }}
          </Button>
        </PopoverTrigger>
        <PopoverContent class="nds-p-0" style="width: 14rem">
          <Command>
            <CommandInput placeholder="Buscar item..." />
            <CommandList>
              <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  v-for="item in items"
                  :key="item.value"
                  :value="item.value"
                  @select="selectItem(item.value)"
                >
                  {{ item.label }}
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('trigger é um combobox com aria-expanded=false', async () => {
      const trigger = canvas.getByRole('combobox');
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });

    await step('clicar no trigger abre o popover', async () => {
      const trigger = canvas.getByRole('combobox');
      await userEvent.click(trigger);
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    });
  },
};

export const CommandPalette: Story = {
  name: 'Command palette (in CommandDialog)',
  render: () => ({
    components: {
      Command,
      CommandDialog,
      CommandEmpty,
      CommandGroup,
      CommandInput,
      CommandItem,
      CommandList,
      CommandSeparator,
      CommandShortcut,
      Button,
    },
    setup() {
      const open = ref(false);

      function openPalette() {
        open.value = true;
      }

      function closeAndSelect(value: string) {
        open.value = false;
      }

      return { open, openPalette, closeAndSelect };
    },
    template: `
      <div class="nds-stack" data-align="center" data-spacing="md">
        <div class="nds-cluster nds-text-body nds-text-muted-foreground" data-align="center" data-spacing="sm">
          <span>Pressione</span>
          <kbd class="nds-cluster pointer-events-none nds-rounded nds-border-default nds-bg-muted nds-font-mono nds-font-medium nds-text-muted-foreground" style="user-select: none; height: 1.25rem; padding-inline: 0.375rem; font-size: 10px" data-align="center" data-spacing="xs" >
            ⌘K
          </kbd>
        </div>
        <Button variant="outline" @click="openPalette">
          Buscar
        </Button>
        <CommandDialog
          v-model:open="open"
          title="Command Palette"
          description="Busque por um comando ou ação..."
        >
          <CommandInput placeholder="Buscar componente..." />
          <CommandList>
            <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
            <CommandGroup heading="Componentes">
              <CommandItem value="button" @select="closeAndSelect('button')">
                Button
                <CommandShortcut>⌘B</CommandShortcut>
              </CommandItem>
              <CommandItem value="input" @select="closeAndSelect('input')">
                Input
                <CommandShortcut>⌘I</CommandShortcut>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Utilitários">
              <CommandItem value="separator" @select="closeAndSelect('separator')">Separator</CommandItem>
              <CommandItem value="badge" @select="closeAndSelect('badge')">Badge</CommandItem>
            </CommandGroup>
          </CommandList>
        </CommandDialog>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('botão "Buscar" está presente', async () => {
      const button = canvas.getByRole('button', { name: 'Buscar' });
      await expect(button).toBeInTheDocument();
    });

    await step('clicar no botão abre o CommandDialog', async () => {
      const button = canvas.getByRole('button', { name: 'Buscar' });
      await userEvent.click(button);
    });
  },
};
