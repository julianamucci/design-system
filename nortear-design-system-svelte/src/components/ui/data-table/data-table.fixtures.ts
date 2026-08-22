import type { DataTableColumn } from './index';
import type { DataTableLabels } from './data-table-labels';

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

/**
 * Rótulos do domínio "fatura".
 *
 * Existe para as stories PROVAREM que `labels` chega ao DOM: os três textos
 * abaixo não aparecem em lugar nenhum do componente, então uma asserção sobre
 * eles falha na hora em que a prop parar de ser lida. As demais chaves ficam
 * de fora de propósito — é o objeto PARCIAL que prova a mesclagem chave a
 * chave contra o padrão.
 */
export const labelsInvoice: Partial<DataTableLabels> = {
  selectAll: 'Selecionar todas as faturas',
  selectRow: (r) => `Selecionar fatura ${r}`,
  rowsSelected: (s, n) => `${s} de ${n} fatura(s) selecionada(s).`,
};

export const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export const statusVariant: Record<Invoice['status'], 'default' | 'secondary' | 'destructive'> = {
  Pago: 'default',
  Pendente: 'secondary',
  Cancelado: 'destructive',
};

export const baseColumns: DataTableColumn<Invoice>[] = [
  { accessorKey: 'id', header: 'Fatura', size: 110 },
  { accessorKey: 'customer', header: 'Cliente', size: 200 },
  {
    accessorKey: 'status',
    header: 'Status',
    size: 140,
    meta: { badgeVariant: (v) => statusVariant[v as Invoice['status']] ?? 'default' },
  },
  { accessorKey: 'method', header: 'Método', size: 200 },
  {
    accessorKey: 'amount',
    header: 'Valor',
    size: 130,
    meta: {
      format: (v) => currency.format(Number(v)),
      cellClass: 'nds-font-medium nds-tabular-nums',
    },
  },
];
