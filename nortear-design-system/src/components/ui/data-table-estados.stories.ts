import type { Meta, StoryObj } from '@storybook/html';
import { createDataTable } from './data-table';
import { type Invoice, baseColumns } from './data-table.fixtures';

// ─── Meta ──────────────────────────────────────────────────────────────────

const meta: Meta = {
  tags: ['tables'],
  title: 'UI/DataTable/Estados',
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
  },
};

export default meta;
type Story = StoryObj;

// ─── SemResultados ──────────────────────────────────────────────────────────

export const SemResultados: Story = {
  render: () => createDataTable<Invoice>({
    columns: baseColumns,
    data: [],
    emptyMessage: 'Nenhuma fatura encontrada.',
  }),
  parameters: { controls: { disable: true }, actions: { disable: true } },
};
