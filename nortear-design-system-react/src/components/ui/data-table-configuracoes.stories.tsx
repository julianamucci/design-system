import type { Meta, StoryObj } from "@storybook/react-vite"
import { within, userEvent, waitFor, expect } from "storybook/test"
import { DataTable } from "./data-table"
import { baseColumns, invoices, type Invoice } from "./data-table.fixtures"

const meta: Meta<typeof DataTable<Invoice>> = {
  title: "UI/DataTable/Settings",
  tags: ["tables"],
  component: DataTable<Invoice>,
  parameters: { controls: { disable: true }, actions: { disable: true } },
}

export default meta
type Story = StoryObj<typeof DataTable<Invoice>>

// Paginação ─────────────────────────────────────────────────────────────────

/** Doze faturas em páginas de cinco: três páginas, a última incompleta. */
const TAMANHO_DE_PAGINA = 5
const TOTAL_DE_PAGINAS = Math.ceil(invoices.length / TAMANHO_DE_PAGINA)

export const Paginated: Story = {
  args: {
    columns: baseColumns,
    data: invoices,
    enableGlobalFilter: false,
    pageSize: TAMANHO_DE_PAGINA,
    // O tamanho inicial precisa existir entre as opções do seletor: fora da
    // lista, o `select` não tem opção marcada e passa a exibir a primeira,
    // dizendo "10" numa tabela que mostra cinco.
    pageSizeOptions: [TAMANHO_DE_PAGINA, 10],
  },
  parameters: {
    covers: ["functional.item8"],
    controls: { disable: true },
    actions: { disable: true },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement)
    const linhas = () => [...canvasElement.querySelectorAll<HTMLElement>("tbody tr")]
    /** Identificador da primeira linha — o que prova qual fatia está na tela. */
    const primeiraFatura = () => linhas()[0].textContent!.trim()

    const primeira = () => canvas.getByRole("button", { name: "Primeira página" }) as HTMLButtonElement
    const anterior = () => canvas.getByRole("button", { name: "Página anterior" }) as HTMLButtonElement
    const proxima = () => canvas.getByRole("button", { name: "Próxima página" }) as HTMLButtonElement
    const ultima = () => canvas.getByRole("button", { name: "Última página" }) as HTMLButtonElement

    // Precondição do passo, e não herança do anterior: o replay reexecuta a play
    // no MESMO DOM, e a última rodada pode ter parado em qualquer página. Na
    // primeira montagem o botão nasce desabilitado — e clicar em botão
    // desabilitado é impossível para quem usa, então nem o teste tenta.
    await step("Voltar ao começo deixa os dois botões de volta apagados", async () => {
      if (!primeira().disabled) await userEvent.click(primeira())
      await waitFor(async () => {
        await expect(primeiraFatura()).toContain("INV-001")
      })
      await expect(linhas().length).toBe(TAMANHO_DE_PAGINA)
      await expect(canvas.getByText(`Página 1 de ${TOTAL_DE_PAGINAS}`)).toBeInTheDocument()

      // Clicar num botão desabilitado é impossível para quem usa. Então o teste
      // AFIRMA a propriedade em vez de tentar o clique.
      await expect(primeira()).toBeDisabled()
      await expect(anterior()).toBeDisabled()
      await expect(proxima()).toBeEnabled()
      await expect(ultima()).toBeEnabled()
    })

    await step("Avançar uma página troca a fatia de linhas", async () => {
      // functional.item8 — o número da página mudar não bastaria: um rodapé
      // pode contar errado e mostrar sempre as mesmas linhas. A prova é a
      // primeira fatura da página ser outra.
      await userEvent.click(proxima())
      await waitFor(async () => {
        await expect(primeiraFatura()).toContain("INV-006")
      })
      await expect(canvas.getByText(`Página 2 de ${TOTAL_DE_PAGINAS}`)).toBeInTheDocument()
      // No meio do caminho os quatro estão vivos: há para onde ir dos dois lados.
      await expect(primeira()).toBeEnabled()
      await expect(anterior()).toBeEnabled()
      await expect(ultima()).toBeEnabled()
    })

    await step("O salto para a última página respeita a fatia incompleta", async () => {
      await userEvent.click(ultima())
      await waitFor(async () => {
        await expect(primeiraFatura()).toContain("INV-011")
      })
      // Doze faturas em páginas de cinco deixam duas na última — número
      // derivado da fixture, nunca escrito à mão.
      await expect(linhas().length).toBe(invoices.length % TAMANHO_DE_PAGINA)
      await expect(
        canvas.getByText(`Página ${TOTAL_DE_PAGINAS} de ${TOTAL_DE_PAGINAS}`)
      ).toBeInTheDocument()

      await expect(proxima()).toBeDisabled()
      await expect(ultima()).toBeDisabled()
      await expect(anterior()).toBeEnabled()
    })

    await step("Retroceder uma página é o caminho inverso do avanço", async () => {
      await userEvent.click(anterior())
      await waitFor(async () => {
        await expect(primeiraFatura()).toContain("INV-006")
      })
      await expect(canvas.getByText(`Página 2 de ${TOTAL_DE_PAGINAS}`)).toBeInTheDocument()
    })

    await step("O seletor de tamanho remonta a fatia", async () => {
      const seletor = canvas.getByRole("combobox", { name: "Linhas por página" })
      await userEvent.selectOptions(seletor, "10")
      await waitFor(async () => {
        await expect(linhas().length).toBe(10)
      })
      // Trocar o tamanho da página não pode deixar o leitor numa página que
      // deixou de existir.
      await expect(canvas.getByText("Página 1 de 2")).toBeInTheDocument()

      // Fecha o ciclo: a rodada seguinte — e a captura de regressão visual —
      // partem da fatia de cinco, na página 1.
      await userEvent.selectOptions(seletor, String(TAMANHO_DE_PAGINA))
      await waitFor(async () => {
        await expect(linhas().length).toBe(TAMANHO_DE_PAGINA)
      })
      if (!primeira().disabled) await userEvent.click(primeira())
      await waitFor(async () => {
        await expect(primeiraFatura()).toContain("INV-001")
      })
    })
  },
}

// Virtualização ─────────────────────────────────────────────────────────────
const bigData: Invoice[] = Array.from({ length: 1000 }, (_, i) => ({
  id: `INV-${String(i + 1).padStart(5, "0")}`,
  customer: invoices[i % invoices.length].customer,
  status: invoices[i % 3].status,
  method: invoices[i % 5].method,
  // Determinístico de propósito: `Math.random()` faria a captura do Chromatic
  // divergir a cada execução.
  amount: (i * 37) % 2000,
}))

export const Virtualized1000Rows: Story = {
  args: {
    columns: baseColumns,
    data: bigData,
    virtualized: true,
    maxHeight: "400px",
    enableColumnVisibility: false,
  },
  parameters: {
    covers: ["functional.item7", "visual.item5"],
    controls: { disable: true },
    actions: { disable: true },
    docs: { canvas: { sourceState: "none" } },
  },
  play: async ({ canvasElement, step }) => {
    const rolador = () =>
      canvasElement.querySelector<HTMLElement>(".nds-data-table-scroll")!
    const linhasDeDado = () =>
      [...canvasElement.querySelectorAll<HTMLElement>("tbody tr")].filter(
        (tr) => !tr.hasAttribute("aria-hidden")
      )

    await step("Mil linhas, mas só as visíveis existem no DOM", async () => {
      // functional.item7 — o número exato depende da altura medida, então a
      // asserção é sobre a ORDEM DE GRANDEZA: renderizar mil `tr` é o defeito
      // que a virtualização existe para evitar.
      await expect(bigData.length).toBe(1000)
      await expect(linhasDeDado().length).toBeGreaterThan(0)
      await expect(linhasDeDado().length).toBeLessThan(100)
      await expect(rolador()).toHaveClass("nds-data-table-scroll-virtual")
      // Sem paginação: virtualizar e paginar ao mesmo tempo não faria sentido.
      await expect(canvasElement.querySelector(".nds-data-table-pagination")).toBeNull()
    })

    await step("As linhas fantasma reservam a altura do que não está montado", async () => {
      // Sem elas a barra de rolagem mediria só o pedaço renderizado e o polegar
      // pularia a cada scroll.
      const fantasmas = canvasElement.querySelectorAll("tbody tr[aria-hidden='true']")
      await expect(fantasmas.length).toBeGreaterThan(0)
    })

    await step("Rolar troca a janela de linhas e mantém a posição", async () => {
      // visual.item5 — a story termina com o scroll no meio, que é o estado
      // que o item documenta.
      const alvo = rolador()
      const primeiraAntes = linhasDeDado()[0].textContent!.trim()
      alvo.scrollTop = 0
      alvo.scrollTop = 4000
      alvo.dispatchEvent(new Event("scroll"))

      await waitFor(async () => {
        await expect(linhasDeDado()[0].textContent!.trim()).not.toBe(primeiraAntes)
      })
      await expect(alvo.scrollTop).toBe(4000)
      await expect(linhasDeDado().length).toBeLessThan(100)
    })
  },
}
