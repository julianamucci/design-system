import type { Meta, StoryObj } from '@storybook/svelte-vite';
import DataTable from './data-table.svelte';
import { baseColumns } from './data-table.fixtures';

const meta: Meta = {
  title: 'UI/DataTable/Estados',
  component: DataTable,
  tags: ['tables'],
  parameters: { controls: { disable: true }, actions: { disable: true } },
};

export default meta;
type Story = StoryObj;

export const SemResultados: Story = {
  args: {
    columns: baseColumns as never,
    data: [],
    emptyMessage: 'Nenhuma fatura encontrada.',
  },
};
