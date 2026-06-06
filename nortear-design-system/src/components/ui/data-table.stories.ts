import type { Meta, StoryObj } from '@storybook/html';
import { within, userEvent, expect, waitFor } from 'storybook/test';
import { createDataTable, type DataTableColumn } from './data-table';
import { createBadge } from './badge';
import { createDataTableDocs } from '@/components/docs/DataTableDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Tipos + dataset ────────────────────────────────────────────────────────

type Invoice = {
  id: string;
  customer: string;
  status: 'Pago' | 'Pendente' | 'Cancelado';
  method: string;
  amount: number;
};

const invoices: Invoice[] = [
  { id: 'INV-001', customer: 'Ana Souza',      status: 'Pago',      method: 'Cartão de crédito', amount: 250 },
  { id: 'INV-002', customer: 'Bruno Lima',     status: 'Pendente',  method: 'Boleto bancário',   amount: 150 },
  { id: 'INV-003', customer: 'Carla Mendes',   status: 'Cancelado', method: 'Pix',               amount: 350 },
  { id: 'INV-004', customer: 'Diego Faria',    status: 'Pago',      method: 'Cartão de débito',  amount: 450 },
  { id: 'INV-005', customer: 'Eva Oliveira',   status: 'Pendente',  method: 'Transferência',     amount: 200 },
  { id: 'INV-006', customer: 'Felipe Castro',  status: 'Pago',      method: 'Pix',               amount: 920 },
  { id: 'INV-007', customer: 'Gabi Rocha',     status: 'Pendente',  method: 'Boleto bancário',   amount: 78 },
  { id: 'INV-008', customer: 'Hugo Almeida',   status: 'Cancelado', method: 'Cartão de crédito', amount: 1200 },
  { id: 'INV-009', customer: 'Iris Pereira',   status: 'Pago',      method: 'Pix',               amount: 60 },
  { id: 'INV-010', customer: 'João Martins',   status: 'Pago',      method: 'Cartão de crédito', amount: 540 },
  { id: 'INV-011', customer: 'Karen Vieira',   status: 'Pendente',  method: 'Boleto bancário',   amount: 220 },
  { id: 'INV-012', customer: 'Lucas Nogueira', status: 'Pago',      method: 'Pix',               amount: 99 },
];

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

const statusVariant: Record<Invoice['status'], 'default' | 'secondary' | 'destructive'> = {
  Pago: 'default',
  Pendente: 'secondary',
  Cancelado: 'destructive',
};

// ─── Colunas base ───────────────────────────────────────────────────────────

const baseColumns: DataTableColumn<Invoice>[] = [
  { accessorKey: 'id', header: 'Fatura', size: 110, meta: { headerLabel: 'Fatura' } },
  { accessorKey: 'customer', header: 'Cliente', size: 200, meta: { headerLabel: 'Cliente' } },
  {
    accessorKey: 'status',
    header: 'Status',
    size: 140,
    meta: {
      headerLabel: 'Status',
      renderCell: (ctx: { value: unknown }) => createBadge({
        variant: statusVariant[ctx.value as Invoice['status']],
        text: ctx.value as string,
      }),
    },
  },
  { accessorKey: 'method', header: 'Método', size: 200, meta: { headerLabel: 'Método' } },
  {
    accessorKey: 'amount',
    header: 'Valor',
    size: 130,
    meta: {
      headerLabel: 'Valor',
      renderCell: (ctx: { value: unknown }) => {
        const span = document.createElement('span');
        span.className = 'nds-font-medium nds-tabular-nums';
        span.textContent = currency.format(ctx.value as number);
        return span;
      },
    },
  },
];

// ─── Meta ──────────────────────────────────────────────────────────────────

const meta: Meta = {
  title: 'UI/DataTable',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: { page: withAutoDocsTab(createDataTableDocs) },
  },
};

export default meta;
type Story = StoryObj;

// ─── Playground ────────────────────────────────────────────────────────────

export const Playground: Story = {
  args: {
    enableRowSelection: true,
    enableGlobalFilter: true,
    enableColumnVisibility: true,
    enablePagination: true,
    globalFilterPlaceholder: 'Buscar fatura, cliente, método...',
  },
  argTypes: {
    enableRowSelection: { control: 'boolean' },
    enableGlobalFilter: { control: 'boolean' },
    enableColumnVisibility: { control: 'boolean' },
    enablePagination: { control: 'boolean' },
    globalFilterPlaceholder: { control: 'text' },
  },
  render: (args: {
    enableRowSelection?: boolean;
    enableGlobalFilter?: boolean;
    enableColumnVisibility?: boolean;
    enablePagination?: boolean;
    globalFilterPlaceholder?: string;
  }) => createDataTable<Invoice>({
    columns: baseColumns,
    data: invoices,
    enableRowSelection: args.enableRowSelection,
    enableGlobalFilter: args.enableGlobalFilter,
    enableColumnVisibility: args.enableColumnVisibility,
    enablePagination: args.enablePagination,
    globalFilterPlaceholder: args.globalFilterPlaceholder,
  }),
  play: async ({ canvasElement, step }) => {
    const c = within(canvasElement);

    await step('Renderiza linhas iniciais', async () => {
      await expect(c.getByText('INV-001')).toBeInTheDocument();
      await expect(c.getByText('Ana Souza')).toBeInTheDocument();
    });

    await step('Filtro global reduz linhas', async () => {
      const search = c.getByLabelText(/Buscar fatura/i) as HTMLInputElement;
      await userEvent.clear(search);
      await userEvent.type(search, 'Pix');
      await waitFor(() => {
        expect(canvasElement.querySelector('.nds-data-table-tr')).not.toBeNull();
      });
      await userEvent.clear(search);
    });

    await step('Ordenação por coluna Valor', async () => {
      const sortBtn = c.getByRole('button', { name: /ordenar por valor/i });
      await userEvent.click(sortBtn);
      await userEvent.click(sortBtn);
    });
  },
};

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

// ─── SemResultados ──────────────────────────────────────────────────────────

export const SemResultados: Story = {
  render: () => createDataTable<Invoice>({
    columns: baseColumns,
    data: [],
    emptyMessage: 'Nenhuma fatura encontrada.',
  }),
  parameters: { controls: { disable: true }, actions: { disable: true } },
};
