import type { Meta, StoryObj } from "@storybook/react-vite"
import { Fragment, useRef } from "react"
import { expect, userEvent } from "storybook/test"
import { InlineCitation, type InlineCitationHandle } from "./inline-citation"
import {
  awaitPanel,
  panelOf,
  sentenceCitations,
  sentenceParts,
  useInlineCitationLabels,
} from "./inline-citation.fixtures"
import {
  inlineCitationInSentenceSource,
  inlineCitationMutuallyExclusiveSource,
} from "./inline-citation.source"

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// As duas composições respondem ao que a peça deliberadamente NÃO faz. Ela não
// escreve a frase, então a primeira mostra quem escreve; e ela não conhece as
// vizinhas, então a segunda mostra quem as conhece. As duas coisas são §2 da
// guideline 17 lida em voz alta: o componente desenha o que recebe.

const meta: Meta = {
  title: "Primitives/Conversational/InlineCitation/Compositions",
  tags: ["conversational"],
  parameters: {
    layout: "padded",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: inlineCitationInSentenceSource },
      description: {
        component:
          "A frase é de quem escreve, e a exclusão mútua entre prévias é de quem monta a página. As duas composições mostram o que a peça entrega a quem a usa em vez de decidir sozinha.",
      },
    },
  },
}

export default meta
type Story = StoryObj

const markersOf = (canvasElement: HTMLElement) => [
  ...canvasElement.querySelectorAll<HTMLElement>('[data-slot="inline-citation-marker"]'),
]

const rootsOf = (canvasElement: HTMLElement) => [
  ...canvasElement.querySelectorAll<HTMLElement>('[data-slot="inline-citation"]'),
]

// Par idempotente: o painel Interactions repete a `play`, e um clique cego
// partiria do estado que a rodada anterior deixou.
const openMarker = async (el: HTMLElement) => {
  if (el.getAttribute("aria-expanded") !== "true") await userEvent.click(el)
}

/**
 * Espera a prévia SAIR, por relógio e com leitura pura.
 *
 * O contrário do `awaitPanel`, e existe pela mesma razão: quem fecha a irmã
 * nesta stack é um efeito, e efeito não é síncrono ao clique. Laço de relógio
 * com prazo, nunca espera por observador de mutação — condição que toca o DOM
 * reagenda a si mesma e pendura a aba sem reprovar.
 */
async function awaitPanelGone(root: HTMLElement, timeoutMs = 1000): Promise<void> {
  const deadline = Date.now() + timeoutMs
  while (panelOf(root) !== null && Date.now() < deadline) {
    await new Promise((resolve) => {
      setTimeout(resolve, 16)
    })
  }
}

/**
 * Duas marcas na mesma frase, com a numeração vinda de fora.
 *
 * A frase é partida onde as marcas entram, e nenhum pedaço termina em espaço: é
 * assim que a marca não se separa da palavra que a antecede quando a linha
 * quebra. A segunda citação é a MÍNIMA de propósito — numa foto só se vê que a
 * prévia desenha o que veio.
 */
function InSentenceExample() {
  const labelsOf = useInlineCitationLabels()
  const parts = sentenceParts()
  const citations = sentenceCitations()

  return (
    <p>
      {parts[0]}
      {citations.map((citation, i) => (
        <Fragment key={i}>
          {/* A NUMERAÇÃO CHEGA DE FORA: ela é conteúdo, e é por ela que a frase
              se refere à lista de fontes do turno. */}
          <InlineCitation
            citation={citation}
            index={i + 1}
            labels={labelsOf(i + 1, citation)}
          />
          {parts[i + 1]}
        </Fragment>
      ))}
    </p>
  )
}

export const InSentence: Story = {
  parameters: {
    covers: ["accessibility.item4", "accessibility.item6", "visual.item5"],
  },
  render: () => <InSentenceExample />,
  play: async ({ canvasElement, step }) => {
    const [first, second] = markersOf(canvasElement)
    const [firstRoot] = rootsOf(canvasElement)

    await step("As duas marcas trazem a própria numeração, na ordem da frase", async () => {
      await expect(first.textContent).toBe("1")
      await expect(second.textContent).toBe("2")
    })

    await step("Receber o FOCO não abre a prévia", async () => {
      // Percorrer com tabulação uma frase de cinco citações abriria cinco
      // prévias, uma por parada (decisão 4 da folha).
      first.focus()
      await expect(document.activeElement).toBe(first)
      await expect(panelOf(firstRoot)).toBeNull()
      await expect(first.getAttribute("aria-expanded")).toBe("false")
    })

    await step("Aberta, a prévia entra LOGO DEPOIS da marca, dentro da mesma raiz", async () => {
      // É o que faz o percurso do teclado alcançar o link do título sem nada
      // mover o foco (decisão 6 da folha): portalada para o fim do documento, a
      // próxima parada seria a palavra seguinte do parágrafo.
      await openMarker(first)
      const panel = (await awaitPanel(firstRoot))!

      await expect(panel.parentElement).toBe(firstRoot)
      await expect(first.nextElementSibling).toBe(panel)

      const title = panel.querySelector<HTMLElement>('[data-slot="inline-citation-title"]')!
      await expect(title.tagName).toBe("A")
      await expect(firstRoot.contains(title)).toBe(true)
    })
  },
}

/**
 * Duas prévias que não ficam abertas ao mesmo tempo.
 *
 * A peça não conhece as vizinhas, e não conhecê-las é o que permite que duas
 * marcas da mesma frase venham de lugares diferentes da resposta. Quem as tem
 * numa lista fecha as outras ao abrir uma — e é a própria peça que devolve a
 * abertura e aceita a ordem de fechar por comando.
 */
function MutuallyExclusiveExample() {
  const labelsOf = useInlineCitationLabels()
  const parts = sentenceParts()
  const citations = sentenceCitations()

  // O comando de cada marca. Nesta stack ele chega por `ref` — divergência de
  // API, e só de API: o par "devolve cada abertura, aceita a ordem de fechar" é
  // o mesmo das cinco stacks.
  const marks = useRef<Array<InlineCitationHandle | null>>([])

  return (
    <p>
      {parts[0]}
      {citations.map((citation, i) => (
        <Fragment key={i}>
          <InlineCitation
            ref={(mark) => {
              marks.current[i] = mark
            }}
            citation={citation}
            index={i + 1}
            labels={labelsOf(i + 1, citation)}
            // A EXCLUSÃO MÚTUA É DAQUI, e não do componente: ele devolve cada
            // abertura, e quem tem a lista decide o que fazer com ela.
            onOpenChange={(open) => {
              if (!open) return
              marks.current.forEach((other, j) => {
                if (j !== i) other?.close()
              })
            }}
          />
          {parts[i + 1]}
        </Fragment>
      ))}
    </p>
  )
}

export const MutuallyExclusive: Story = {
  parameters: {
    covers: ["functional.item8", "visual.item6"],
    docs: { source: { transform: inlineCitationMutuallyExclusiveSource } },
  },
  render: () => <MutuallyExclusiveExample />,
  play: async ({ canvasElement, step }) => {
    const [first, second] = markersOf(canvasElement)
    const [firstRoot, secondRoot] = rootsOf(canvasElement)

    await step("Abrir a primeira monta a prévia dela, e só a dela", async () => {
      await openMarker(first)
      await expect(await awaitPanel(firstRoot)).not.toBeNull()
      await expect(panelOf(secondRoot)).toBeNull()
    })

    await step("Abrir a segunda fecha a primeira, pelo evento que a peça devolve", async () => {
      // O componente não procurou a irmã: quem a fechou foi a página, com a
      // lista que só ela tem.
      await openMarker(second)
      await expect(await awaitPanel(secondRoot)).not.toBeNull()
      await awaitPanelGone(firstRoot)
      await expect(panelOf(firstRoot)).toBeNull()
      await expect(first.getAttribute("aria-expanded")).toBe("false")
      await expect(second.getAttribute("aria-expanded")).toBe("true")
    })
  },
}
