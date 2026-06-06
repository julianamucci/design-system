import type { Meta, StoryObj } from '@storybook/svelte';
import DataTable from './data-table.svelte';
import { baseColumns } from './data-table.fixtures';

const meta = {
  title: 'UI/DataTable/Estados',
  component: DataTable,
  tags: ['tables'],
  parameters: { controls: { disable: true }, actions: { disable: true } },
} satisfies Meta<typeof DataTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SemResultados: Story = {
  args: {
    columns: baseColumns as never,
    data: [],
    emptyMessage: 'Nenhuma fatura encontrada.',
  },
};
