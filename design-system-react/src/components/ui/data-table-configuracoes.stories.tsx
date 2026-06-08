import type { Meta, StoryObj } from "@storybook/react"
import { DataTable } from "./data-table"
import { baseColumns, invoices, type Invoice } from "./data-table.fixtures"

const meta: Meta<typeof DataTable<Invoice>> = {
  title: "UI/DataTable/Configuracoes",
  tags: ["tables"],
  component: DataTable<Invoice>,
  parameters: { controls: { disable: true }, actions: { disable: true } },
}

export default meta
type Story = StoryObj<typeof DataTable<Invoice>>

// Virtualização ─────────────────────────────────────────────────────────────
const bigData: Invoice[] = Array.from({ length: 1000 }, (_, i) => ({
  id: `INV-${String(i + 1).padStart(5, "0")}`,
  customer: invoices[i % invoices.length].customer,
  status: invoices[i % 3].status,
  method: invoices[i % 5].method,
  amount: Math.round(Math.random() * 2000),
}))

export const Virtualizado1000Linhas: Story = {
  args: {
    columns: baseColumns,
    data: bigData,
    virtualized: true,
    maxHeight: "400px",
    enableColumnVisibility: false,
  },
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    docs: { canvas: { sourceState: "none" } },
  },
}
