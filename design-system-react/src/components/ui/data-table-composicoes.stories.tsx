import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { DataTable, type DataTableColumn } from "./data-table"
import { Badge } from "@/components/ui/badge"
import {
  baseColumns,
  currency,
  invoices,
  statusVariant,
  type Invoice,
} from "./data-table.fixtures"

const meta: Meta<typeof DataTable<Invoice>> = {
  title: "UI/DataTable/Composicoes",
  tags: ["tables"],
  component: DataTable<Invoice>,
  parameters: { controls: { disable: true }, actions: { disable: true } },
}

export default meta
type Story = StoryObj<typeof DataTable<Invoice>>

// Filtros por coluna ────────────────────────────────────────────────────────
const filterableColumns: DataTableColumn<Invoice>[] = [
  { accessorKey: "id", header: "Fatura", meta: { filter: { type: "text" } } },
  { accessorKey: "customer", header: "Cliente", meta: { filter: { type: "text" } } },
  {
    accessorKey: "status",
    header: "Status",
    meta: { filter: { type: "select", options: ["Pago", "Pendente", "Cancelado"] } },
    cell: ({ row }) => (
      <Badge variant={statusVariant[row.original.status]}>
        {row.original.status}
      </Badge>
    ),
  },
  {
    accessorKey: "method",
    header: "Método",
    meta: { filter: { type: "select", options: ["Cartão de crédito", "Boleto bancário", "Pix", "Cartão de débito", "Transferência"] } },
  },
  {
    accessorKey: "amount",
    header: "Valor",
    cell: ({ row }) => (
      <span className="font-medium tabular-nums">
        {currency.format(row.original.amount)}
      </span>
    ),
  },
]

export const ComFiltrosPorColuna: Story = {
  args: {
    columns: filterableColumns,
    data: invoices,
    enableColumnFilters: true,
  },
  parameters: { controls: { disable: true }, actions: { disable: true } },
}

// Resize ────────────────────────────────────────────────────────────────────
export const ColunasRedimensionaveis: Story = {
  args: {
    columns: baseColumns,
    data: invoices,
    enableColumnResizing: true,
  },
  parameters: { controls: { disable: true }, actions: { disable: true } },
}

// Reorder + Pin ─────────────────────────────────────────────────────────────
export const ReordenavelEFixavel: Story = {
  args: {
    columns: baseColumns,
    data: invoices,
    enableColumnOrdering: true,
    enableColumnPinning: true,
  },
  parameters: { controls: { disable: true }, actions: { disable: true } },
}

// Edição inline ─────────────────────────────────────────────────────────────
const editableColumns: DataTableColumn<Invoice>[] = [
  { accessorKey: "id", header: "Fatura" },
  { accessorKey: "customer", header: "Cliente", meta: { editable: true } },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={statusVariant[row.original.status]}>
        {row.original.status}
      </Badge>
    ),
  },
  { accessorKey: "method", header: "Método", meta: { editable: true } },
  {
    accessorKey: "amount",
    header: "Valor",
    meta: { editable: true },
    cell: ({ row }) => (
      <span className="font-medium tabular-nums">
        {currency.format(row.original.amount)}
      </span>
    ),
  },
]

function EditDemo() {
  const [data, setData] = React.useState<Invoice[]>(invoices.slice(0, 6))
  return (
    <DataTable<Invoice>
      columns={editableColumns}
      data={data}
      enableGlobalFilter={false}
      enableColumnVisibility={false}
      enablePagination={false}
      onCellEdit={(rowIndex, columnId, value) => {
        setData((old) =>
          old.map((row, i) =>
            i === rowIndex ? { ...row, [columnId]: value } : row
          )
        )
      }}
    />
  )
}

export const ComEdicaoInline: Story = {
  render: () => <EditDemo />,
  parameters: { controls: { disable: true }, actions: { disable: true } },
}
