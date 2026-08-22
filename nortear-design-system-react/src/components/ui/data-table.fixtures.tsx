import { type DataTableColumn, type DataTableLabels } from "./data-table"
import { Badge } from "@/components/ui/badge"

export type Invoice = {
  id: string
  customer: string
  status: "Pago" | "Pendente" | "Cancelado"
  method: string
  amount: number
}

export const invoices: Invoice[] = [
  { id: "INV-001", customer: "Ana Souza",      status: "Pago",      method: "Cartão de crédito", amount: 250 },
  { id: "INV-002", customer: "Bruno Lima",     status: "Pendente",  method: "Boleto bancário",   amount: 150 },
  { id: "INV-003", customer: "Carla Mendes",   status: "Cancelado", method: "Pix",               amount: 350 },
  { id: "INV-004", customer: "Diego Faria",    status: "Pago",      method: "Cartão de débito",  amount: 450 },
  { id: "INV-005", customer: "Eva Oliveira",   status: "Pendente",  method: "Transferência",     amount: 200 },
  { id: "INV-006", customer: "Felipe Castro",  status: "Pago",      method: "Pix",               amount: 920 },
  { id: "INV-007", customer: "Gabi Rocha",     status: "Pendente",  method: "Boleto bancário",   amount: 78 },
  { id: "INV-008", customer: "Hugo Almeida",   status: "Cancelado", method: "Cartão de crédito", amount: 1200 },
  { id: "INV-009", customer: "Iris Pereira",   status: "Pago",      method: "Pix",               amount: 60 },
  { id: "INV-010", customer: "João Martins",   status: "Pago",      method: "Cartão de crédito", amount: 540 },
  { id: "INV-011", customer: "Karen Vieira",   status: "Pendente",  method: "Boleto bancário",   amount: 220 },
  { id: "INV-012", customer: "Lucas Nogueira", status: "Pago",      method: "Pix",               amount: 99 },
]

/**
 * Rótulos da tabela de FATURAS.
 *
 * As stories precisam de um texto que o padrão não produz para que a prova de
 * `labels` seja real: com "Selecionar todas as linhas" nos dois lados, uma
 * asserção passaria mesmo se a prop fosse ignorada. "fatura" no lugar de "linha"
 * é também o texto que a interface deveria ter — quem lê a tela vê faturas, não
 * linhas de uma grade.
 */
export const labelsInvoice: Partial<DataTableLabels> = {
  selectAll: "Selecionar todas as faturas",
  selectRow: (r) => `Selecionar fatura ${r}`,
  rowsSelected: (s, n) => `${s} de ${n} fatura(s) selecionada(s).`,
}

export const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
})

export const statusVariant: Record<Invoice["status"], "default" | "secondary" | "destructive"> = {
  Pago: "default",
  Pendente: "secondary",
  Cancelado: "destructive",
}

export const baseColumns: DataTableColumn<Invoice>[] = [
  { accessorKey: "id", header: "Fatura", size: 110 },
  { accessorKey: "customer", header: "Cliente", size: 200 },
  {
    accessorKey: "status",
    header: "Status",
    size: 140,
    cell: ({ row }) => (
      <Badge variant={statusVariant[row.original.status]}>
        {row.original.status}
      </Badge>
    ),
  },
  { accessorKey: "method", header: "Método", size: 200 },
  {
    accessorKey: "amount",
    header: "Valor",
    size: 130,
    cell: ({ row }) => (
      <span className="nds-font-medium nds-tabular-nums">
        {currency.format(row.original.amount)}
      </span>
    ),
  },
]
