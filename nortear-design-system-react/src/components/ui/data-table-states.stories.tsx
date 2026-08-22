import type { Meta, StoryObj } from "@storybook/react-vite"
import { within, expect } from "storybook/test"
import { DataTable } from "./data-table"
import { dataTableNoResultsSource, dataTableSource } from "./data-table.source"
import { baseColumns, type Invoice } from "./data-table.fixtures"

const meta: Meta<typeof DataTable<Invoice>> = {
  title: "UI/DataTable/States",
  tags: ["tables"],
  component: DataTable<Invoice>,
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    docs: { source: { transform: dataTableSource } },
  },
}

export default meta
type Story = StoryObj<typeof DataTable<Invoice>>

export const NoResults: Story = {
  args: {
    columns: baseColumns,
    data: [],
    enableRowSelection: true,
    emptyMessage: "Nenhuma fatura encontrada.",
  },
  parameters: {
    covers: ["visual.item6"],
    controls: { disable: true },
    actions: { disable: true },
    // O conjunto VAZIO é o assunto: um snippet com dados ensinaria o contrário
    // do que a story mostra.
    docs: { source: { transform: dataTableNoResultsSource } },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)

    await step("A mensagem ocupa a largura inteira da tabela", async () => {
      // visual.item6 — sem o colspan a mensagem cairia sob a primeira coluna e
      // as outras cinco ficariam vazias, como se faltassem dados.
      const celula = canvasElement.querySelector<HTMLTableCellElement>(
        ".nds-data-table-empty"
      )!
      // Seis: as cinco colunas mais a de seleção. Derivado, nunca escrito à mão.
      await expect(celula).toHaveAttribute("colspan", String(baseColumns.length + 1))
      await expect(celula).toHaveTextContent("Nenhuma fatura encontrada.")
      await expect(canvasElement.querySelectorAll("tbody tr").length).toBe(1)
    })

    await step("A estrutura e a toolbar sobrevivem ao vazio", async () => {
      // Estado vazio não é motivo para desmontar a grade: quem usa leitor de
      // tela precisa saber que colunas voltarão quando houver dados — e quem
      // esvaziou o resultado com um filtro precisa do campo para desfazer.
      await expect(canvas.getByRole("table")).toBeInTheDocument()
      await expect(
        canvasElement.querySelectorAll("thead tr:first-child th").length
      ).toBe(baseColumns.length + 1)
      await expect(canvas.getByRole("searchbox")).toBeInTheDocument()
    })

    await step("Sem linha nenhuma, o cabeçalho de seleção não fica marcado", async () => {
      // "Todas selecionadas" com zero linhas seria verdade vazia — e o checkbox
      // nasceria marcado numa tabela sem nada para marcar.
      const allBox = canvas.getByRole("checkbox", {
        name: "Selecionar todas as linhas",
      })
      await expect(allBox).toHaveAttribute("aria-checked", "false")
      await expect(canvasElement.querySelector("[role='status']")).toHaveTextContent(
        "0 de 0 linha(s) selecionada(s)."
      )
    })
  },
}
