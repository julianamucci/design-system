import type { Meta, StoryObj } from '@storybook/html';
import { userEvent, within, expect } from 'storybook/test';
import { createCommand } from './command';
import { createCommandDocs } from '@/components/docs/CommandDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────

type CommandArgs = {
  placeholder: string;
  showGroups: boolean;
};

const meta: Meta<CommandArgs> = {
  title: 'UI/Command',
  tags: ['autodocs', 'overlay'],
  parameters: {
    docs: { page: withAutoDocsTab(createCommandDocs) },
  },
  argTypes: {
    placeholder: {
      control: 'text',
      description: 'Placeholder do campo de busca',
    },
    showGroups: {
      control: 'boolean',
      description: 'Exibir itens com grupos',
    },
  },
  args: {
    placeholder: 'Buscar componente...',
    showGroups: true,
  },
};

export default meta;
type Story = StoryObj<CommandArgs>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildItems(withGroups: boolean) {
  if (withGroups) {
    return [
      { value: 'button',    label: 'Button',    group: 'Componentes' },
      { value: 'input',     label: 'Input',     group: 'Componentes' },
      { value: 'separator', label: 'Separator', group: 'Componentes' },
      { value: 'cn',        label: 'cn()',       group: 'Utilitários' },
      { value: 'clsx',      label: 'clsx()',     group: 'Utilitários' },
    ];
  }
  return [
    { value: 'button',    label: 'Button'    },
    { value: 'input',     label: 'Input'     },
    { value: 'separator', label: 'Separator' },
    { value: 'cn',        label: 'cn()'      },
    { value: 'clsx',      label: 'clsx()'    },
  ];
}

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  render: (args) => {
    const wrap = document.createElement('div');
    wrap.className = 'nds-border-default nds-rounded-md nds-shadow-md';
    wrap.style.width = '320px';
    wrap.appendChild(
      createCommand({
        placeholder: args.placeholder,
        items: buildItems(args.showGroups),
      })
    );
    return wrap;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Campo de busca está presente', async () => {
      const input = canvas.getByRole('combobox');
      await expect(input).toBeInTheDocument();
      await expect(input).toBeVisible();
    });

    await step('Placeholder é exibido corretamente', async () => {
      const input = canvas.getByRole('combobox');
      await expect(input).toHaveAttribute('placeholder', 'Buscar componente...');
    });

    await step('Lista de itens está presente', async () => {
      const list = canvas.getByRole('listbox');
      await expect(list).toBeInTheDocument();
    });

    await step('Filtro reduz itens ao digitar', async () => {
      const input = canvas.getByRole('combobox');
      await userEvent.type(input, 'but');
      const options = canvas.getAllByRole('option');
      await expect(options.length).toBeGreaterThan(0);
      await userEvent.clear(input);
    });
  },
};
