<script lang="ts">
  /**
   * Andaime de um grafo só — o Playground e a maior parte das stories.
   *
   * É componente, e não trecho no arquivo de story, porque num `*.stories.ts`
   * todo export nomeado vira story: não há onde escrever marcação sem publicar
   * uma story a mais na barra lateral.
   *
   * Os rótulos são DERIVADOS do idioma, e não montados uma vez: a barra de
   * idioma do Storybook troca o idioma com a story montada, e o nome da camada
   * que rola é texto de interface. Sem o invólucro, o `render` montaria os
   * rótulos no idioma em que a story abriu e eles ficariam para trás na troca.
   *
   * O INVÓLUCRO É TAMBÉM ONDE OS EIXOS DO PLAYGROUND VIRAM DADO: "quantos nós
   * entram" vira uma fatia da lista, e "houve dependência?" vira lista vazia de
   * ligações. Os dois são recorte de quem consome, e é assim que esta família
   * revela um grafo aos poucos — a peça não tem contador de revelação.
   *
   * E É ELE QUE PERMITE AFIRMAR QUE NADA FOI DESENHADO. Sem nó nenhum a peça não
   * desenha marcação — nem moldura, nem camada que rola —, e sem um elemento de
   * fora a asserção não teria a que apontar.
   */
  import type { FlowEdge, FlowNode, RunStatus } from '@shared/primitives/chat-protocol';
  import {
    FLOW_EDGES_ORDER,
    FLOW_NODES_ORDER,
  } from '@shared/primitives/flow-graph-examples';
  import { locale } from '@/lib/i18n';
  import { FlowGraph } from './index';
  import { flowGraphLabelsFor } from './flow-graph.fixtures';

  const {
    nodes = FLOW_NODES_ORDER,
    edges = FLOW_EDGES_ORDER,
    revealed,
    withEdges = true,
    status = 'running',
    hostClass,
    testid,
  }: {
    /** Os nós, na ordem em que devem ser ouvidos. */
    nodes?: readonly FlowNode[];
    /** As dependências. Ligação sem as duas pontas é descartada pela conta. */
    edges?: readonly FlowEdge[];
    /** Quantos nós entram. Ausente é "todos os que vieram". */
    revealed?: number;
    /** Houve dependência? Sem ligação nenhuma sobram as caixas soltas. */
    withEdges?: boolean;
    /** Em que pé está a execução que escreve o grafo. */
    status?: RunStatus;
    /** Teto de largura, quando o assunto da story é a rolagem. */
    hostClass?: string;
    /** O endereço que a `play` usa para apontar para o invólucro. */
    testid?: string;
  } = $props();

  const labels = $derived(flowGraphLabelsFor($locale));
  const shownNodes = $derived(revealed === undefined ? nodes : nodes.slice(0, revealed));
  const shownEdges = $derived(withEdges ? edges : []);
</script>

<div class={hostClass} data-testid={testid}>
  <FlowGraph nodes={shownNodes} edges={shownEdges} {status} {labels} />
</div>
