import type { Meta, StoryObj } from '@storybook/svelte-vite';
import DataTable from './data-table.svelte';
import type { DataTableColumn } from './index';
import { invoices, baseColumns, currency, statusVariant, type Invoice } from './data-table.fixtures';

const meta: Meta = {
  title: 'UI/DataTable/Compositions',
  component: DataTable,
  tags: ['tables'],
  parameters: { controls: { disable: true }, actions: { disable: true } },
};

export default meta;
type Story = StoryObj;

const filterableColumns: DataTableColumn<Invoice>[] = [
  { accessorKey: 'id', header: 'Fatura', meta: { filter: { type: 'text' } } },
  { accessorKey: 'customer', header: 'Cliente', meta: { filter: { type: 'text' } } },
  {
    accessorKey: 'status',
    header: 'Status',
    meta: {
      filter: { type: 'select', options: ['Pago', 'Pendente', 'Cancelado'] },
      badgeVariant: (v) => statusVariant[v as Invoice['status']] ?? 'default',
    },
  },
  {
    accessorKey: 'method',
    header: 'Método',
    meta: {
      filter: {
        type: 'select',
        options: ['Cartão de crédito', 'Boleto bancário', 'Pix', 'Cartão de débito', 'Transferência'],
      },
    },
  },
  {
    accessorKey: 'amount',
    header: 'Valor',
    meta: {
      format: (v) => currency.format(Number(v)),
      cellClass: 'font-medium tabular-nums',
    },
  },
];

export const WithColumnFilters: Story = {
  args: {
    columns: filterableColumns as never,
    data: invoices,
    enableColumnFilters: true,
  },
};

export const ResizableColumns: Story = {
  args: {
    columns: baseColumns as never,
    data: invoices,
    enableColumnResizing: true,
  },
};

export const ReorderableAndPinnable: Story = {
  args: {
    columns: baseColumns as never,
    data: invoices,
    enableColumnOrdering: true,
    enableColumnPinning: true,
  },
};

const editableColumns: DataTableColumn<Invoice>[] = [
  { accessorKey: 'id', header: 'Fatura' },
  { accessorKey: 'customer', header: 'Cliente', meta: { editable: true } },
  {
    accessorKey: 'status',
    header: 'Status',
    meta: { badgeVariant: (v) => statusVariant[v as Invoice['status']] ?? 'default' },
  },
  { accessorKey: 'method', header: 'Método', meta: { editable: true } },
  {
    accessorKey: 'amount',
    header: 'Valor',
    meta: {
      editable: true,
      format: (v) => currency.format(Number(v)),
      cellClass: 'font-medium tabular-nums',
    },
  },
];

export const WithInlineEditing: Story = {
  args: {
    columns: editableColumns as never,
    data: invoices.slice(0, 6),
    enableGlobalFilter: false,
    enableColumnVisibility: false,
    enablePagination: false,
  },
};
