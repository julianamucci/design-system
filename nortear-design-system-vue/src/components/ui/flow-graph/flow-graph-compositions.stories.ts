import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect } from 'storybook/test';
import { FlowGraph } from './index';
import {
  LONG_LABEL_EDGES,
  LONG_LABEL_NODES,
  REJOIN_EDGES,
  REJOIN_NODES,
  flowGraphLabels,
  useFlowGraphLabels,
  wideFlowEdges,
  wideFlowNodes,
} from './flow-graph.fixtures';
import {
  flowGraphLongLabelsSnippet,
  flowGraphPartialSnippet,
  flowGraphRejoinSnippet,
  flowGraphTightColumnsSnippet,
  flowGraphWideSnippet,
} from './flow-graph.source';
import type { FlowEdge, FlowNode } from '@shared/primitives/chat-protocol';
import {
  FLOW_EDGES_ORDER,
  FLOW_NODES_ORDER,
  FLOW_NODES_PARTIAL,
} from '@shared/primitives/flow-graph-examples';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// O que muda quando o grafo encosta nos limites: quando ele não cabe na
// conversa, quando o rótulo é longo demais para a coluna, quando um ramo volta
// para trás e quando ele chega pela metade.

const meta: Meta = {
  title: 'Components/Conversational/FlowGraph/Compositions',
  tags: ['conversational'],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: flowGraphWideSnippet },
      description: {
        component:
          'Os casos de borda do desenho: mais largo que a conversa, com rótulos longos, com um ramo que volta e com menos nós do que o grafo inteiro.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/**
 * Um grafo só, com um teto de largura opcional.
 *
 * O teto é parte do assunto quando a story fotografa a rolagem: o canvas do
 * Storybook é largo, e sem ele o grafo largo ficaria folgado — o guarda da
 * rolagem ficaria verde sem nada para medir.
 */
const mount = (
  nodes: readonly FlowNode[],
  edges: readonly FlowEdge[],
  hostClass = '',
) => ({
  components: { FlowGraph },
  setup() {
    return { labels: useFlowGraphLabels(), nodes, edges, hostClass };
  },
  template: `<div :class="hostClass">
    <FlowGraph
      :nodes="nodes"
      :edges="edges"
      status="running"
      :labels="labels"
    />
  </div>`,
});

const pieceOf = (canvasElement: HTMLElement) =>
  canvasElement.querySelector<HTMLElement>('[data-slot="flow-graph"]')!;

const gridLines = (piece: HTMLElement, axis: 'column' | 'row') =>
  [...piece.querySelectorAll<HTMLElement>('[data-slot="flow-graph-node"]')].map((node) =>
    // O valor COMPUTADO, e nunca o atributo: propriedade personalizada declarada
    // dentro do próprio seletor vence a herança, e ler o `style` provaria só que
    // alguém escreveu alguma coisa ali.
    Number(getComputedStyle(node).getPropertyValue(`--flow-graph-node-${axis}`).trim()),
  );

/**
 * O mesmo grafo, declarado longe da origem.
 *
 * As coordenadas de um nó são RELATIVAS entre si: quem monta não precisa saber
 * de convenção nenhuma sobre onde começa a contagem, e o grafo inteiro desliza
 * até encostar. O desenho é idêntico ao da story em andamento, e é esse o
 * assunto.
 */
const SHIFTED_NODES: readonly FlowNode[] = FLOW_NODES_ORDER.map((node) => ({
  ...node,
  column: node.column + 5,
  row: node.row + 3,
}));

export const Shifted: Story = {
  parameters: {
    covers: ['functional.item3'],
    docs: { source: { transform: flowGraphWideSnippet } },
  },
  render: () => mount(SHIFTED_NODES, FLOW_EDGES_ORDER),
  play: async ({ canvasElement, step }) => {
    const piece = pieceOf(canvasElement);

    await step('O grafo encosta na origem, sem colunas vazias à esquerda', async () => {
      // Linha de grade conta a partir de UM, então encostar é a menor valer 1.
      await expect(Math.min(...gridLines(piece, 'column'))).toBe(1);
      await expect(Math.min(...gridLines(piece, 'row'))).toBe(1);
    });

    await step('A forma do grafo não muda com o deslocamento', async () => {
      // Quatro colunas e três linhas, como o mesmo grafo declarado na origem.
      await expect(Math.max(...gridLines(piece, 'column'))).toBe(4);
      await expect(Math.max(...gridLines(piece, 'row'))).toBe(3);
    });
  },
};

/**
 * Mais largo que a conversa.
 *
 * Oito colunas passam de qualquer conversa com a largura mínima que a folha
 * declara, e é aí que a camada rola — uma só, com nome e parada de teclado.
 */
export const Wide: Story = {
  parameters: {
    covers: ['functional.item10', 'visual.item6'],
    docs: { source: { transform: flowGraphWideSnippet } },
  },
  render: () => mount(wideFlowNodes(), wideFlowEdges(), 'nds-max-w-md'),
  play: async ({ canvasElement, step }) => {
    const piece = pieceOf(canvasElement);
    const viewport = piece.querySelector<HTMLElement>('[data-slot="flow-graph-viewport"]')!;

    await step('Uma só camada rola, e é a que tem nome e foco', async () => {
      // O desenho é mais largo que a camada: é essa desigualdade que faz a
      // barra existir, e é o elemento que RECORTA que precisa ser medido — a
      // raiz do documento não transborda.
      await expect(viewport.scrollWidth).toBeGreaterThan(viewport.clientWidth);
      await expect(viewport.tabIndex).toBe(0);
      await expect(viewport.getAttribute('role')).toBe('group');
      await expect(viewport.getAttribute('aria-label')).toBe(flowGraphLabels().region);
    });

    await step('Nenhuma outra camada rola', async () => {
      const canvas = piece.querySelector<HTMLElement>('[data-slot="flow-graph-canvas"]')!;
      const list = piece.querySelector<HTMLElement>('[data-slot="flow-graph-nodes"]')!;
      for (const layer of [canvas, list]) {
        await expect(layer.scrollWidth).toBe(layer.clientWidth);
      }
    });
  },
};

/**
 * O grafo pela metade — a revelação feita como esta família a faz.
 *
 * Não existe contador de revelação: quem revela passa menos nós, e as três
 * ligações que perderam uma ponta somem sozinhas.
 */
export const Partial: Story = {
  parameters: {
    covers: ['visual.item5'],
    docs: { source: { transform: flowGraphPartialSnippet } },
  },
  render: () => mount(FLOW_NODES_PARTIAL, FLOW_EDGES_ORDER),
  play: async ({ canvasElement, step }) => {
    const piece = pieceOf(canvasElement);

    await step('Só as ligações internas ao que veio são desenhadas', async () => {
      const ids = new Set(FLOW_NODES_PARTIAL.map((node) => node.id));
      const expected = FLOW_EDGES_ORDER.filter(
        (edge) => ids.has(edge.from) && ids.has(edge.to),
      );
      await expect(piece.querySelectorAll('[data-slot="flow-graph-edge"]').length).toBe(
        expected.length,
      );
      await expect(piece.querySelectorAll('[data-slot="flow-graph-node"]').length).toBe(
        FLOW_NODES_PARTIAL.length,
      );
    });
  },
};

/** Rótulos longos: eles quebram, e nunca são cortados. */
export const LongLabels: Story = {
  parameters: {
    covers: ['visual.item7'],
    docs: { source: { transform: flowGraphLongLabelsSnippet } },
  },
  render: () => mount(LONG_LABEL_NODES, LONG_LABEL_EDGES),
  play: async ({ canvasElement, step }) => {
    const piece = pieceOf(canvasElement);

    await step('O rótulo inteiro está no DOM, sem reticências', async () => {
      // Um nó pela metade é uma instrução pela metade, e reticências escondem
      // justamente o que distingue dois ramos que começam igual.
      const labels = [
        ...piece.querySelectorAll<HTMLElement>('[data-slot="flow-graph-node-label"]'),
      ];
      await expect(labels.map((label) => label.textContent)).toEqual(
        LONG_LABEL_NODES.map((node) => node.label),
      );
      // Ele QUEBRA em vez de esticar a coluna: a caixa é mais alta que duas
      // vezes o `font-size`, o que uma linha só nunca seria. Medido contra
      // `font-size`, que computa em pixel em qualquer motor — `line-height`
      // declarada sem unidade nem sempre computa.
      const firstLabel = labels[0];
      const fontSize = Number.parseFloat(getComputedStyle(firstLabel).fontSize);
      await expect(firstLabel.getBoundingClientRect().height).toBeGreaterThan(fontSize * 1.9);
    });
  },
};

/** Um ramo que volta para uma coluna anterior. */
export const Rejoin: Story = {
  parameters: {
    covers: ['visual.item8'],
    docs: { source: { transform: flowGraphRejoinSnippet } },
  },
  render: () => mount(REJOIN_NODES, REJOIN_EDGES),
  play: async ({ canvasElement, step }) => {
    const piece = pieceOf(canvasElement);

    await step('A ligação que volta é desenhada como as outras', async () => {
      // Fila não se ramifica nem se reencontra, e é este caso que ela não
      // consegue nem escrever.
      await expect(piece.querySelectorAll('[data-slot="flow-graph-edge"]').length).toBe(
        REJOIN_EDGES.length,
      );
    });

    await step('O nó de reencontro diz que depende dos dois lados', async () => {
      // `analise` é o nó a que o ramo VOLTA: chega uma ligação da entrada e
      // outra do ajuste, e a leitura dele tem de dizer as duas.
      const rejoinNode = piece.querySelector<HTMLElement>(
        '[data-slot="flow-graph-node"][data-node-id="analise"]',
      )!;
      const reading = rejoinNode.querySelector<HTMLElement>(
        '[data-slot="flow-graph-node-reading"]',
      )!;
      await expect(reading.textContent).toContain('Receber o caso');
      await expect(reading.textContent).toContain('Ajustar a análise');
    });
  },
};

/**
 * A largura mínima de coluna, apertada por quem consome.
 *
 * É a única superfície de customização da peça, e é ela que decide quando o
 * grafo passa a rolar. Entra por propriedade personalizada na folha de quem
 * monta, e nunca por largura em `style`.
 */
export const TightColumns: Story = {
  parameters: {
    docs: { source: { transform: flowGraphTightColumnsSnippet } },
  },
  // OS DOIS LADO A LADO, e é o único jeito de a asserção medir alguma coisa: o
  // valor da propriedade lido por `getPropertyValue` é o ESPECIFICADO, e num
  // token declarado por `calc()` ele volta como a expressão, não como o pixel.
  // O que compara de verdade é a largura da caixa, e para comparar é preciso
  // haver duas.
  render: () => ({
    components: { FlowGraph },
    setup() {
      return {
        labels: useFlowGraphLabels(),
        nodes: wideFlowNodes(),
        edges: wideFlowEdges(),
        // Declarada NO PRÓPRIO elemento, e não num invólucro: a folha a declara
        // em `.nds-flow-graph`, e propriedade personalizada declarada dentro do
        // próprio seletor vence a herança — o invólucro nunca a alcançaria.
        // Nesta stack o caminho é o repasse de `style`, que o Vue funde na raiz
        // do componente.
        tight: { '--flow-graph-column-min': 'var(--spacing-16)' },
      };
    },
    template: `<div class="nds-stack nds-max-w-md" data-spacing="lg">
      <FlowGraph
        data-testid="flow-graph-default-columns"
        :nodes="nodes"
        :edges="edges"
        status="running"
        :labels="labels"
      />
      <FlowGraph
        data-testid="flow-graph-tight-columns"
        :style="tight"
        :nodes="nodes"
        :edges="edges"
        status="running"
        :labels="labels"
      />
    </div>`,
  }),
  play: async ({ canvasElement, step }) => {
    const widthOf = (testid: string) =>
      canvasElement
        .querySelector<HTMLElement>(`[data-testid="${testid}"] [data-slot="flow-graph-node"]`)!
        .getBoundingClientRect().width;

    await step('A coluna aperta, e a caixa do nó encolhe com ela', async () => {
      // A largura da caixa é COMPUTADA, e é o que prova que a propriedade
      // chegou ao elemento — ler o `style` provaria só que alguém escreveu ali.
      await expect(widthOf('flow-graph-tight-columns')).toBeLessThan(
        widthOf('flow-graph-default-columns'),
      );
    });
  },
};
