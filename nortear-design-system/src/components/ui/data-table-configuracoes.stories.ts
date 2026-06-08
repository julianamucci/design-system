import type { Meta, StoryObj } from '@storybook/html';
import { createDataTable } from './data-table';
import { type Invoice, invoices, baseColumns } from './data-table.fixtures';

// ─── Meta ──────────────────────────────────────────────────────────────────

const meta: Meta = {
  tags: ['tables'],
  title: 'UI/DataTable/Configuracoes',
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
  },
};

export default meta;
type Story = StoryObj;

// ─── Virtualizado1000Linhas ─────────────────────────────────────────────────

const bigData: Invoice[] = Array.from({ length: 1000 }, (_, i) => ({
  id: `INV-${String(i + 1).padStart(5, '0')}`,
  customer: invoices[i % invoices.length].customer,
  status: invoices[i % 3].status,
  method: invoices[i % 5].method,
  amount: Math.round(Math.random() * 2000),
}));

export const Virtualizado1000Linhas: Story = {
  render: () => createDataTable<Invoice>({
    columns: baseColumns,
    data: bigData,
    virtualized: true,
    maxHeight: '400px',
    enableColumnVisibility: false,
  }),
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    docs: { canvas: { sourceState: 'none' } },
  },
};
