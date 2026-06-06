import { createBadge } from './badge';
import type { DataTableColumn } from './data-table';

// ─── Tipos + dataset ────────────────────────────────────────────────────────

export type Invoice = {
  id: string;
  customer: string;
  status: 'Pago' | 'Pendente' | 'Cancelado';
  method: string;
  amount: number;
};

export const invoices: Invoice[] = [
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

export const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export const statusVariant: Record<Invoice['status'], 'default' | 'secondary' | 'destructive'> = {
  Pago: 'default',
  Pendente: 'secondary',
  Cancelado: 'destructive',
};

// ─── Colunas base ───────────────────────────────────────────────────────────

export const baseColumns: DataTableColumn<Invoice>[] = [
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
