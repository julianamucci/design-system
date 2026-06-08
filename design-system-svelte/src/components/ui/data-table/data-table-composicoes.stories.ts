import type { Meta, StoryObj } from '@storybook/svelte';
import DataTable from './data-table.svelte';
import type { DataTableColumn } from './index';
import { invoices, baseColumns, currency, statusVariant, type Invoice } from './data-table.fixtures';

const meta = {
  title: 'UI/DataTable/Composicoes',
  component: DataTable,
  tags: ['tables'],
  parameters: { controls: { disable: true }, actions: { disable: true } },
} satisfies Meta<typeof DataTable>;

export default meta;
type Story = StoryObj<typeof meta>;

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

export const ComFiltrosPorColuna: Story = {
  args: {
    columns: filterableColumns as never,
    data: invoices,
    enableColumnFilters: true,
  },
};

export const ColunasRedimensionaveis: Story = {
  args: {
    columns: baseColumns as never,
    data: invoices,
    enableColumnResizing: true,
  },
};

export const ReordenavelEFixavel: Story = {
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

export const ComEdicaoInline: Story = {
  args: {
    columns: editableColumns as never,
    data: invoices.slice(0, 6),
    enableGlobalFilter: false,
    enableColumnVisibility: false,
    enablePagination: false,
  },
};
