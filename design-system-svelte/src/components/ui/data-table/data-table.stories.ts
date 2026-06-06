import type { Meta, StoryObj } from '@storybook/svelte';
import { within, userEvent, expect } from 'storybook/test';
import DataTable from './data-table.svelte';
import type { DataTableColumn } from './index';
import DataTableDocs from '@/components/docs/DataTableDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

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

const baseColumns: DataTableColumn<Invoice>[] = [
  { accessorKey: 'id', header: 'Fatura', size: 110 },
  { accessorKey: 'customer', header: 'Cliente', size: 200 },
  { accessorKey: 'status', header: 'Status', size: 140 },
  { accessorKey: 'method', header: 'Método', size: 200 },
  {
    accessorKey: 'amount',
    header: 'Valor',
    size: 130,
    meta: { format: (v) => currency.format(Number(v)) },
  },
];

const meta = {
  title: 'UI/DataTable',
  component: DataTable,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: { page: withAutoDocsTab(DataTableDocs) },
  },
} satisfies Meta<typeof DataTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    columns: baseColumns as never,
    data: invoices,
    enableRowSelection: true,
    globalFilterPlaceholder: 'Buscar fatura, cliente, método...',
  },
  play: async ({ canvasElement, step }) => {
    const c = within(canvasElement);

    await step('Renderiza linhas iniciais', async () => {
      await expect(c.getByText('INV-001')).toBeInTheDocument();
      await expect(c.getByText('Ana Souza')).toBeInTheDocument();
    });

    await step('Filtro global reduz linhas', async () => {
      const search = c.getByLabelText(/buscar/i);
      await userEvent.clear(search);
      await userEvent.type(search, 'Pix');
      await expect(c.queryByText('Boleto bancário')).not.toBeInTheDocument();
      await userEvent.clear(search);
    });

    await step('Ordenação por coluna Valor', async () => {
      const sortBtn = c.getByRole('button', { name: /ordenar por valor/i });
      await userEvent.click(sortBtn);
      await userEvent.click(sortBtn);
    });
  },
};

// ── Com Filtros por Coluna ───────────────────────────────────────────────
const filterableColumns: DataTableColumn<Invoice>[] = [
  { accessorKey: 'id', header: 'Fatura', meta: { filter: { type: 'text' } } },
  { accessorKey: 'customer', header: 'Cliente', meta: { filter: { type: 'text' } } },
  {
    accessorKey: 'status',
    header: 'Status',
    meta: { filter: { type: 'select', options: ['Pago', 'Pendente', 'Cancelado'] } },
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
    meta: { format: (v) => currency.format(Number(v)) },
  },
];

export const ComFiltrosPorColuna: Story = {
  args: {
    columns: filterableColumns as never,
    data: invoices,
    enableColumnFilters: true,
  },
  parameters: { controls: { disable: true }, actions: { disable: true } },
};

export const ColunasRedimensionaveis: Story = {
  args: {
    columns: baseColumns as never,
    data: invoices,
    enableColumnResizing: true,
  },
  parameters: { controls: { disable: true }, actions: { disable: true } },
};

export const ReordenavelEFixavel: Story = {
  args: {
    columns: baseColumns as never,
    data: invoices,
    enableColumnOrdering: true,
    enableColumnPinning: true,
  },
  parameters: { controls: { disable: true }, actions: { disable: true } },
};

// ── Edição inline ────────────────────────────────────────────────────────
const editableColumns: DataTableColumn<Invoice>[] = [
  { accessorKey: 'id', header: 'Fatura' },
  { accessorKey: 'customer', header: 'Cliente', meta: { editable: true } },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'method', header: 'Método', meta: { editable: true } },
  {
    accessorKey: 'amount',
    header: 'Valor',
    meta: { editable: true, format: (v) => currency.format(Number(v)) },
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
  parameters: { controls: { disable: true }, actions: { disable: true } },
};

// ── Virtualização ────────────────────────────────────────────────────────
const bigData: Invoice[] = Array.from({ length: 1000 }, (_, i) => ({
  id: `INV-${String(i + 1).padStart(5, '0')}`,
  customer: invoices[i % invoices.length].customer,
  status: invoices[i % 3].status,
  method: invoices[i % 5].method,
  amount: Math.round(Math.random() * 2000),
}));

export const Virtualizado1000Linhas: Story = {
  args: {
    columns: baseColumns as never,
    data: bigData,
    virtualized: true,
    maxHeight: '400px',
    enableColumnVisibility: false,
  },
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    docs: { canvas: { sourceState: 'none' } },
  },
};

export const SemResultados: Story = {
  args: {
    columns: baseColumns as never,
    data: [],
    emptyMessage: 'Nenhuma fatura encontrada.',
  },
  parameters: { controls: { disable: true }, actions: { disable: true } },
};
