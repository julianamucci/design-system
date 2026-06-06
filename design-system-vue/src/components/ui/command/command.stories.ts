// @jsxImportSource react
import type { Meta, StoryObj } from '@storybook/vue3';
import { fn, userEvent, within, expect } from 'storybook/test';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import CommandDocs from '@/components/docs/CommandDocs.vue';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';

const meta = {
  title: 'UI/Command',
  component: Command,
  tags: ['autodocs', 'overlay'],
  parameters: {
    layout: 'centered',
    docs: {
      page: withAutoDocsTab(CommandDocs),
      description: {
        component:
          'Interface de busca e seleção rápida com filtro fuzzy integrado. Suporta padrões inline, combobox e command palette.',
      },
    },
  },
  argTypes: {
    loop: {
      control: 'boolean',
      description: 'Navegação por teclado cicla do último para o primeiro item',
    },
    shouldFilter: {
      control: 'boolean',
      description: 'Habilita filtro interno por texto (desative para filtro externo)',
    },
  },
  args: {
    loop: false,
    shouldFilter: true,
  },
} satisfies Meta<any>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    onUpdate: fn(),
  } as any,
  render: (args) => ({
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
      return { args };
    },
    template: `
      <div class="w-72 rounded-xl border border-border shadow-md overflow-hidden">
        <Command v-bind="args">
          <CommandInput placeholder="Buscar componente..." />
          <CommandList>
            <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
            <CommandGroup heading="Componentes">
              <CommandItem value="button">
                Button
                <CommandShortcut>⌘B</CommandShortcut>
              </CommandItem>
              <CommandItem value="input">Input</CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Utilitários">
              <CommandItem value="separator">Separator</CommandItem>
              <CommandItem value="badge">Badge</CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('input está presente e acessível', async () => {
      const input = canvas.getByRole('combobox');
      await expect(input).toBeInTheDocument();
    });

    await step('digitar filtra os itens', async () => {
      const input = canvas.getByRole('combobox');
      await userEvent.type(input, 'butt');
      await expect(input).toHaveValue('butt');
    });

    await step('limpar input restaura todos os itens', async () => {
      const input = canvas.getByRole('combobox');
      await userEvent.clear(input);
      await expect(input).toHaveValue('');
    });
  },
};
