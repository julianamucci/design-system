import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect } from "storybook/test"
import {
  flowGraphLabels,
  FlowGraphHost,
  useFlowGraphLabels,
} from "./flow-graph.fixtures"
import {
  flowGraphEveryStateSource,
  flowGraphFailureSource,
  flowGraphRunningSource,
} from "./flow-graph.source"
import {
  TOOL_CALL_STATES,
  type FlowEdge,
  type FlowNode,
} from "@shared/primitives/chat-protocol"
import {
  FLOW_EDGES_ORDER,
  FLOW_NODES_FAILURE,
  FLOW_NODES_ORDER,
} from "@shared/primitives/flow-graph-examples"

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// O estado é do NÓ, e não da peça — o que a peça tem é o estado da execução que
// a escreve, e ele decide uma coisa só: se ela se declara ocupada. Por isso esta
// grade fotografa os quatro estados de nó lado a lado, e não quatro grafos.

const meta: Meta = {
  title: "Primitives/Conversational/FlowGraph/States",
  tags: ["conversational"],
  parameters: {
    layout: "padded",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: flowGraphEveryStateSource },
      description: {
        component:
          "Os quatro estados de nó, com forma própria em cada um e a palavra que chega a quem não vê a forma. O estado da execução decide apenas se a peça se declara ocupada.",
      },
    },
  },
}

export default meta
type Story = StoryObj

const pieceOf = (canvasElement: HTMLElement) =>
  canvasElement.querySelector<HTMLElement>('[data-slot="flow-graph"]')

const nodesIn = (piece: HTMLElement) => [
  ...piece.querySelectorAll<HTMLElement>('[data-slot="flow-graph-node"]'),
]

/** As ligações da fila dos quatro estados: cada um depende do anterior. */
function everyStateEdges(): FlowEdge[] {
  return TOOL_CALL_STATES.slice(1).map((state, index) => ({
    from: TOOL_CALL_STATES[index],
    to: state,
  }))
}

/**
 * Um grafo em fila com um nó por estado.
 *
 * A lista sai de `TOOL_CALL_STATES`, e não de quatro chamadas escritas à mão:
 * estado novo no vocabulário compartilhado entra nesta story sozinho, e ninguém
 * precisa lembrar de mexer aqui. O rótulo de cada nó é a palavra do próprio
 * estado, e ela vem do hook — assim a grade se reescreve quando o idioma muda.
 */
function EveryStateExample() {
  const labels = useFlowGraphLabels()
  const nodes: FlowNode[] = TOOL_CALL_STATES.map((state, index) => ({
    id: state,
    label: labels.state[state],
    column: index,
    row: 0,
    state,
  }))

  // A execução já terminou: é o par desta grade, e o que ela mostra é que a
  // peça deixa de se declarar ocupada sem apagar estado de nó nenhum.
  return <FlowGraphHost nodes={nodes} edges={everyStateEdges()} status="complete" />
}

/** Os quatro estados de nó, na mesma grade. */
export const EveryState: Story = {
  parameters: {
    covers: ["functional.item7", "functional.item9", "visual.item2"],
    docs: { source: { transform: flowGraphEveryStateSource } },
  },
  render: () => <EveryStateExample />,
  play: async ({ canvasElement, step }) => {
    const piece = pieceOf(canvasElement)!
    const labels = flowGraphLabels()

    await step("Há um nó por estado, e cada um diz qual é o seu", async () => {
      const nodes = nodesIn(piece)
      await expect(nodes.length).toBe(TOOL_CALL_STATES.length)
      await expect(nodes.map((n) => n.dataset.state)).toEqual([...TOOL_CALL_STATES])
    })

    await step("A palavra do estado chega a quem não vê a forma da marca", async () => {
      // Forma para quem vê, palavra para quem ouve, e ninguém fica com a cor
      // sozinha (WCAG 1.4.1).
      for (const state of TOOL_CALL_STATES) {
        const node = piece.querySelector<HTMLElement>(
          `[data-slot="flow-graph-node"][data-node-id="${state}"]`,
        )!
        const reading = node.querySelector<HTMLElement>(
          '[data-slot="flow-graph-node-reading"]',
        )!
        await expect(reading.textContent).toContain(labels.state[state])
        // A marca é decorativa: ela é a leitura rápida para quem vê, e repetir
        // o estado em desenho não acrescenta nada a quem ouve.
        const marker = node.querySelector<HTMLElement>(
          '[data-slot="flow-graph-node-marker"]',
        )!
        await expect(marker.getAttribute("aria-hidden")).toBe("true")
      }
    })

    await step("A execução terminou, e a peça deixa de se declarar ocupada", async () => {
      await expect(piece.getAttribute("aria-busy")).toBeNull()
    })
  },
}

/** Um caminho que quebrou: o estado que a referência não tem. */
export const Failure: Story = {
  parameters: {
    covers: ["visual.item3"],
    docs: { source: { transform: flowGraphFailureSource } },
  },
  render: () => (
    <FlowGraphHost nodes={FLOW_NODES_FAILURE} edges={FLOW_EDGES_ORDER} status="failed" />
  ),
  play: async ({ canvasElement, step }) => {
    const piece = pieceOf(canvasElement)!

    await step("O nó que quebrou desenha diferente do que terminou", async () => {
      // É o estado que a fonte do catálogo achata: lá um caminho quebrado
      // desenharia igual a um que terminou.
      const broken = piece.querySelector<HTMLElement>(
        '[data-slot="flow-graph-node"][data-state="failed"]',
      )
      await expect(broken).not.toBeNull()
      await expect(broken!.dataset.nodeId).toBe("estoque")
      const finished = piece.querySelectorAll('[data-state="done"]')
      await expect(finished.length).toBe(2)
    })

    await step("A execução que falhou não se declara ocupada", async () => {
      await expect(piece.getAttribute("aria-busy")).toBeNull()
    })
  },
}

/** Em andamento, com a execução ocupada. */
export const Running: Story = {
  parameters: {
    covers: ["visual.item4"],
    docs: { source: { transform: flowGraphRunningSource } },
  },
  render: () => (
    <FlowGraphHost nodes={FLOW_NODES_ORDER} edges={FLOW_EDGES_ORDER} status="running" />
  ),
  play: async ({ canvasElement, step }) => {
    const piece = pieceOf(canvasElement)!

    await step("Enquanto corre, a peça se declara ocupada", async () => {
      // `aria-busy` é o que substitui a região viva nesta família: ele diz que
      // aquele pedaço da tela ainda se escreve, sem anunciar nada.
      await expect(piece.getAttribute("aria-busy")).toBe("true")
      await expect(piece.querySelectorAll("[aria-live]").length).toBe(0)
    })

    await step("O grafo inteiro desenha as seis ligações", async () => {
      await expect(piece.querySelectorAll('[data-slot="flow-graph-edge"]').length).toBe(
        FLOW_EDGES_ORDER.length,
      )
    })
  },
}

/**
 * Sem nó nenhum: a peça prefere não existir.
 *
 * Devolver uma moldura vazia seria pior que devolver nada — a camada que rola é
 * parada de teclado, e uma parada que leva a uma caixa vazia é ruído com nome.
 */
export const Empty: Story = {
  parameters: {
    covers: ["functional.item8"],
    docs: { source: { transform: flowGraphEveryStateSource } },
  },
  render: () => (
    <FlowGraphHost
      nodes={[]}
      edges={FLOW_EDGES_ORDER}
      status="idle"
      testid="flow-graph-empty-host"
    />
  ),
  play: async ({ canvasElement, step }) => {
    await step("Não há grafo, e nada é desenhado", async () => {
      const host = canvasElement.querySelector<HTMLElement>(
        '[data-testid="flow-graph-empty-host"]',
      )!
      await expect(host.children.length).toBe(0)
      await expect(pieceOf(canvasElement)).toBeNull()
    })
  },
}
