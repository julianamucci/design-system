import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, userEvent, expect } from 'storybook/test';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';

const meta = {
  title: 'UI/Command/States',
  component: Command,
  tags: ['overlay'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
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

export const EmptyState: Story = {
  name: 'No results (CommandEmpty)',
  render: () => ({
    components: { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList },
    setup() {
      return {};
    },
    template: `
      <div class="rounded-xl nds-border-default shadow-md nds-overflow-hidden" style="width: 18rem">
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

    await step('Digitar termo inexistente exibe CommandEmpty', async () => {
      const input = canvasElement.querySelector('input[data-slot="command-input"]') as HTMLInputElement
        ?? (canvasElement.querySelector('input') as HTMLInputElement);
      await userEvent.click(input);
      await userEvent.keyboard('zzz');
      const empty = await canvas.findByText('Nenhum resultado encontrado.', undefined, { timeout: 2000 });
      await expect(empty).toBeVisible();
    });
  },
};

export const ItemDisabled: Story = {
  render: () => ({
    components: { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList },
    setup() {
      return {};
    },
    template: `
      <div class="rounded-xl nds-border-default shadow-md nds-overflow-hidden" style="width: 18rem">
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
      await expect(disabledItem).toHaveAttribute('data-disabled');
    });

    await step('item desabilitado tem opacidade reduzida via classe', async () => {
      const disabledItem = canvas.getByText('Input (desabilitado)').closest('[data-slot="command-item"]');
      if (!disabledItem) throw new Error('command-item ancestral não encontrado');
      await expect(disabledItem).toHaveClass('nds-command-item');
      await expect(getComputedStyle(disabledItem).opacity).toBe('0.5');
    });
  },
};
