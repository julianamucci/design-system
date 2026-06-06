import type { Meta, StoryObj } from "@storybook/react"
import { DataTable } from "./data-table"
import { baseColumns, type Invoice } from "./data-table.fixtures"

const meta: Meta<typeof DataTable<Invoice>> = {
  title: "UI/DataTable/Estados",
  tags: ["tables"],
  component: DataTable<Invoice>,
  parameters: { controls: { disable: true }, actions: { disable: true } },
}

export default meta
type Story = StoryObj<typeof DataTable<Invoice>>

export const SemResultados: Story = {
  args: {
    columns: baseColumns,
    data: [],
    emptyMessage: "Nenhuma fatura encontrada.",
  },
  parameters: { controls: { disable: true }, actions: { disable: true } },
}
