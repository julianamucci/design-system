import { h } from 'vue';
import { Badge } from '@/components/ui/badge';
import type { DataTableColumn, DataTableLabels } from './index';

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
  { id: 'INV-007', customer: 'Gabi Rocha',     status: 'Pendente',  method: 'Boleto bancário',   amount: 78  },
  { id: 'INV-008', customer: 'Hugo Almeida',   status: 'Cancelado', method: 'Cartão de crédito', amount: 1200 },
  { id: 'INV-009', customer: 'Iris Pereira',   status: 'Pago',      method: 'Pix',               amount: 60  },
  { id: 'INV-010', customer: 'João Martins',   status: 'Pago',      method: 'Cartão de crédito', amount: 540 },
  { id: 'INV-011', customer: 'Karen Vieira',   status: 'Pendente',  method: 'Boleto bancário',   amount: 220 },
  { id: 'INV-012', customer: 'Lucas Nogueira', status: 'Pago',      method: 'Pix',               amount: 99  },
];

/**
 * Rótulos do domínio de faturas.
 *
 * Só três chaves — e é esse o ponto: a story prova que `labels` é PARCIAL, que
 * o que não foi informado (paginação, menu de colunas, ordenação) continua no
 * padrão, e que "linha" vira "fatura" onde a pessoa lê o nome do controle. Sem
 * uma story passando isto, `labels` seria API declarada e nunca exercida.
 *
 * `rowsSelected` repete o texto do padrão de propósito: o mesmo conjunto de
 * rótulos vale nas stacks TanStack, e mudar a contagem só aqui faria a mesma
 * story dizer coisas diferentes em cada uma. O que ela precisa provar é a
 * FORMA — dois números, na ordem que o idioma pedir.
 */
export const labelsInvoice: Partial<DataTableLabels> = {
  selectAll: 'Selecionar todas as faturas',
  selectRow: (r) => `Selecionar fatura ${r}`,
  rowsSelected: (s, n) => `${s} de ${n} linha(s) selecionada(s).`,
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
    cell: ({ row }) =>
      h(Badge, { variant: statusVariant[row.original.status] }, () => row.original.status),
  },
  { accessorKey: 'method', header: 'Método', size: 200 },
  {
    accessorKey: 'amount',
    header: 'Valor',
    size: 130,
    cell: ({ row }) =>
      h(
        'span',
        { class: 'nds-font-medium nds-tabular-nums' },
        currency.format(row.original.amount),
      ),
  },
];
