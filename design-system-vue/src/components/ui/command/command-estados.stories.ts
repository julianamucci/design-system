import type { Meta, StoryObj } from '@storybook/vue3';
import { userEvent, within, expect } from 'storybook/test';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';

const meta = {
  title: 'UI/Command/Estados',
  component: Command,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Estados do Command: sem resultados (CommandEmpty) e item desabilitado.',
      },
    },
  },
} satisfies Meta<typeof Command>;

export default meta;
type Story = StoryObj<typeof meta>;

export const EstadoVazio: Story = {
  name: 'Sem resultados (CommandEmpty)',
  render: () => ({
    components: { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList },
    setup() {
      return {};
    },
    template: `
      <div class="w-72 rounded-xl border border-border shadow-md overflow-hidden">
        <Command>
          <CommandInput placeholder="Buscar componente..." model-value="zzz" />
          <CommandList>
            <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
            <CommandGroup heading="Componentes">
              <CommandItem value="button">Button</CommandItem>
              <CommandItem value="input">Input</CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('CommandEmpty é exibido quando não há resultados', async () => {
      const empty = canvas.getByText('Nenhum resultado encontrado.');
      await expect(empty).toBeVisible();
    });
  },
};

export const ItemDesabilitado: Story = {
  name: 'Item desabilitado',
  render: () => ({
    components: { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList },
    setup() {
      return {};
    },
    template: `
      <div class="w-72 rounded-xl border border-border shadow-md overflow-hidden">
        <Command>
          <CommandInput placeholder="Buscar..." />
          <CommandList>
            <CommandEmpty>Nenhum resultado.</CommandEmpty>
            <CommandGroup heading="Componentes">
              <CommandItem value="button">Button</CommandItem>
              <CommandItem value="input" :disabled="true">
                Input (desabilitado)
              </CommandItem>
              <CommandItem value="badge">Badge</CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('item desabilitado tem atributo data-disabled', async () => {
      const disabledItem = canvas.getByText('Input (desabilitado)').closest('[data-slot="command-item"]');
      await expect(disabledItem).toHaveAttribute('data-disabled', 'true');
    });

    await step('item desabilitado tem opacidade reduzida via classe', async () => {
      const disabledItem = canvas.getByText('Input (desabilitado)').closest('[data-slot="command-item"]');
      await expect(disabledItem).toHaveClass('data-[disabled=true]:opacity-50');
    });
  },
};
