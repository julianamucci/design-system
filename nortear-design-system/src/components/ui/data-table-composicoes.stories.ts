import type { Meta, StoryObj } from '@storybook/html';
import { createDataTable, type DataTableColumn } from './data-table';
import { createBadge } from './badge';
import { type Invoice, invoices, currency, statusVariant, baseColumns } from './data-table.fixtures';

// ─── Meta ──────────────────────────────────────────────────────────────────

const meta: Meta = {
  tags: ['tables'],
  title: 'UI/DataTable/Composicoes',
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
  },
};

export default meta;
type Story = StoryObj;

// ─── ComFiltrosPorColuna ────────────────────────────────────────────────────

const filterableColumns: DataTableColumn<Invoice>[] = [
  { accessorKey: 'id', header: 'Fatura', meta: { headerLabel: 'Fatura', filter: { type: 'text' } } },
  { accessorKey: 'customer', header: 'Cliente', meta: { headerLabel: 'Cliente', filter: { type: 'text' } } },
  {
    accessorKey: 'status',
    header: 'Status',
    meta: {
      headerLabel: 'Status',
      filter: { type: 'select', options: ['Pago', 'Pendente', 'Cancelado'] },
      renderCell: (ctx: { value: unknown }) => createBadge({
        variant: statusVariant[ctx.value as Invoice['status']],
        text: ctx.value as string,
      }),
    },
  },
  {
    accessorKey: 'method',
    header: 'Método',
    meta: {
      headerLabel: 'Método',
      filter: { type: 'select', options: ['Cartão de crédito', 'Boleto bancário', 'Pix', 'Cartão de débito', 'Transferência'] },
    },
  },
  {
    accessorKey: 'amount',
    header: 'Valor',
    meta: {
      headerLabel: 'Valor',
      renderCell: (ctx: { value: unknown }) => {
        const s = document.createElement('span');
        s.className = 'nds-font-medium nds-tabular-nums';
        s.textContent = currency.format(ctx.value as number);
        return s;
      },
    },
  },
];

export const ComFiltrosPorColuna: Story = {
  render: () => createDataTable<Invoice>({
    columns: filterableColumns,
    data: invoices,
    enableColumnFilters: true,
  }),
  parameters: { controls: { disable: true }, actions: { disable: true } },
};

// ─── ColunasRedimensionaveis ────────────────────────────────────────────────

export const ColunasRedimensionaveis: Story = {
  render: () => createDataTable<Invoice>({
    columns: baseColumns,
    data: invoices,
    enableColumnResizing: true,
  }),
  parameters: { controls: { disable: true }, actions: { disable: true } },
};

// ─── ReordenavelEFixavel ────────────────────────────────────────────────────

export const ReordenavelEFixavel: Story = {
  render: () => createDataTable<Invoice>({
    columns: baseColumns,
    data: invoices,
    enableColumnOrdering: true,
    enableColumnPinning: true,
  }),
  parameters: { controls: { disable: true }, actions: { disable: true } },
};

// ─── ComEdicaoInline ────────────────────────────────────────────────────────

const editableColumns: DataTableColumn<Invoice>[] = [
  { accessorKey: 'id', header: 'Fatura', meta: { headerLabel: 'Fatura' } },
  { accessorKey: 'customer', header: 'Cliente', meta: { headerLabel: 'Cliente', editable: true } },
  {
    accessorKey: 'status',
    header: 'Status',
    meta: {
      headerLabel: 'Status',
      renderCell: (ctx: { value: unknown }) => createBadge({
        variant: statusVariant[ctx.value as Invoice['status']],
        text: ctx.value as string,
      }),
    },
  },
  { accessorKey: 'method', header: 'Método', meta: { headerLabel: 'Método', editable: true } },
  {
    accessorKey: 'amount',
    header: 'Valor',
    meta: {
      headerLabel: 'Valor',
      editable: true,
      renderCell: (ctx: { value: unknown }) => {
        const s = document.createElement('span');
        s.className = 'nds-font-medium nds-tabular-nums';
        s.textContent = currency.format(ctx.value as number);
        return s;
      },
    },
  },
];

export const ComEdicaoInline: Story = {
  render: () => {
    const wrap = document.createElement('div');
    let workingData = invoices.slice(0, 6);

    function mount() {
      wrap.replaceChildren();
      wrap.appendChild(createDataTable<Invoice>({
        columns: editableColumns,
        data: workingData,
        enableGlobalFilter: false,
        enableColumnVisibility: false,
        enablePagination: false,
        onCellEdit: (rowIndex, columnId, value) => {
          workingData = workingData.map((row, i) =>
            i === rowIndex ? { ...row, [columnId]: value } as Invoice : row,
          );
          mount();
        },
      }));
    }
    mount();
    return wrap;
  },
  parameters: { controls: { disable: true }, actions: { disable: true } },
};
