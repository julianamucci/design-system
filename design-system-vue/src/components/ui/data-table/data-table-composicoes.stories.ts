import type { Meta, StoryObj } from '@storybook/vue3';
import { h, ref } from 'vue';
import { DataTable, type DataTableColumn } from './index';
import { Badge } from '@/components/ui/badge';
import {
  type Invoice,
  invoices,
  currency,
  statusVariant,
  baseColumns,
} from './data-table.fixtures';

const meta: Meta<Record<string, unknown>> = {
  title: 'UI/DataTable/Composicoes',
  component: DataTable as never,
  tags: ['tables'],
  parameters: { controls: { disable: true }, actions: { disable: true } },
};

export default meta;
type Story = StoryObj<Record<string, unknown>>;

// ── Filtros por coluna ─────────────────────────────────────────────────────
const filterableColumns: DataTableColumn<Invoice>[] = [
  { accessorKey: 'id', header: 'Fatura', meta: { filter: { type: 'text' } } },
  { accessorKey: 'customer', header: 'Cliente', meta: { filter: { type: 'text' } } },
  {
    accessorKey: 'status',
    header: 'Status',
    meta: { filter: { type: 'select', options: ['Pago', 'Pendente', 'Cancelado'] } },
    cell: ({ row }) =>
      h(Badge, { variant: statusVariant[row.original.status] }, () => row.original.status),
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
    cell: ({ row }) =>
      h(
        'span',
        { class: 'font-medium tabular-nums' },
        currency.format(row.original.amount),
      ),
  },
];

export const ComFiltrosPorColuna: Story = {
  render: () => ({
    components: { DataTable },
    setup() {
      return { columns: filterableColumns, data: invoices };
    },
    template: `<DataTable :columns="columns" :data="data" :enable-column-filters="true" />`,
  }),
  parameters: { controls: { disable: true }, actions: { disable: true } },
};

// ── Resize ─────────────────────────────────────────────────────────────────
export const ColunasRedimensionaveis: Story = {
  render: () => ({
    components: { DataTable },
    setup() {
      return { columns: baseColumns, data: invoices };
    },
    template: `<DataTable :columns="columns" :data="data" :enable-column-resizing="true" />`,
  }),
  parameters: { controls: { disable: true }, actions: { disable: true } },
};

// ── Reorder + Pin ──────────────────────────────────────────────────────────
export const ReordenavelEFixavel: Story = {
  render: () => ({
    components: { DataTable },
    setup() {
      return { columns: baseColumns, data: invoices };
    },
    template: `<DataTable :columns="columns" :data="data" :enable-column-ordering="true" :enable-column-pinning="true" />`,
  }),
  parameters: { controls: { disable: true }, actions: { disable: true } },
};

// ── Edição inline ──────────────────────────────────────────────────────────
const editableColumns: DataTableColumn<Invoice>[] = [
  { accessorKey: 'id', header: 'Fatura' },
  { accessorKey: 'customer', header: 'Cliente', meta: { editable: true } },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) =>
      h(Badge, { variant: statusVariant[row.original.status] }, () => row.original.status),
  },
  { accessorKey: 'method', header: 'Método', meta: { editable: true } },
  {
    accessorKey: 'amount',
    header: 'Valor',
    meta: { editable: true },
    cell: ({ row }) =>
      h(
        'span',
        { class: 'font-medium tabular-nums' },
        currency.format(row.original.amount),
      ),
  },
];

export const ComEdicaoInline: Story = {
  render: () => ({
    components: { DataTable },
    setup() {
      const data = ref<Invoice[]>(invoices.slice(0, 6));
      const onCellEdit = (rowIndex: number, columnId: string, value: unknown) => {
        data.value = data.value.map((row, i) =>
          i === rowIndex ? { ...row, [columnId]: value } : row,
        );
      };
      return { columns: editableColumns, data, onCellEdit };
    },
    template: `<DataTable
      :columns="columns"
      :data="data"
      :enable-global-filter="false"
      :enable-column-visibility="false"
      :enable-pagination="false"
      @cell-edit="onCellEdit"
    />`,
  }),
  parameters: { controls: { disable: true }, actions: { disable: true } },
};
