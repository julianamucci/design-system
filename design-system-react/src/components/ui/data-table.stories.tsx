import type { Meta, StoryObj } from "@storybook/react"
import { within, userEvent, expect } from "storybook/test"
import { DataTable } from "./data-table"
import { DataTableDocs } from "@/components/docs/DataTableDocs"
import { withAutoDocsTab } from "@/lib/withAutoDocsTab"
import { baseColumns, invoices, type Invoice } from "./data-table.fixtures"

const meta: Meta<typeof DataTable<Invoice>> = {
  title: "UI/DataTable",
  component: DataTable<Invoice>,
  tags: ["autodocs", "tables"],
  parameters: {
    layout: "padded",
    docs: { page: withAutoDocsTab(DataTableDocs) },
  },
}

export default meta
type Story = StoryObj<typeof DataTable<Invoice>>

export const Playground: Story = {
  args: {
    columns: baseColumns,
    data: invoices,
    enableRowSelection: true,
    globalFilterPlaceholder: "Buscar fatura, cliente, método...",
  },
  play: async ({ canvasElement, step }) => {
    const c = within(canvasElement)

    await step("Renderiza linhas iniciais", async () => {
      await expect(c.getByText("INV-001")).toBeInTheDocument()
      await expect(c.getByText("Ana Souza")).toBeInTheDocument()
    })

    await step("Filtro global reduz linhas", async () => {
      const search = c.getByLabelText(/buscar/i)
      await userEvent.clear(search)
      await userEvent.type(search, "Pix")
      await expect(c.queryByText("Boleto bancário")).not.toBeInTheDocument()
      await userEvent.clear(search)
    })

    await step("Ordenação por coluna Valor", async () => {
      const sortBtn = c.getByRole("button", { name: /ordenar por valor/i })
      await userEvent.click(sortBtn)
      await userEvent.click(sortBtn)
    })
  },
}
