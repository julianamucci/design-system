<script lang="ts">
  /**
   * Andaime da largura mínima de coluna, apertada por quem consome.
   *
   * É a única superfície de customização da peça, e é ela que decide quando o
   * grafo passa a rolar. Entra por propriedade personalizada na folha de quem
   * monta, e nunca por largura em `style`.
   *
   * E "a folha dele", nesta stack, é um bloco de estilo escopado. A distinção
   * não é de gosto: a folha DECLARA `--flow-graph-column-min` no próprio
   * `.nds-flow-graph`, e declaração no elemento vence valor herdado. Pôr a
   * propriedade num invólucro ficaria sem efeito nenhum, e a story fotografaria
   * a largura padrão achando que fotografa a apertada — portão sem dentes. Por
   * isso a regra sai daqui com especificidade maior, escopada ao invólucro para
   * não vazar para o resto da página. É o mesmo caminho que o snippet do painel
   * Code ensina a quem consome.
   *
   * OS DOIS LADO A LADO, e é o único jeito de a asserção medir alguma coisa: o
   * valor da propriedade lido por `getPropertyValue` é o ESPECIFICADO, e num
   * token declarado por `calc()` ele volta como a expressão, não como o pixel.
   * O que compara de verdade é a largura da caixa, e para comparar é preciso
   * haver duas.
   */
  import { locale } from '@/lib/i18n';
  import { FlowGraph } from './index';
  import {
    flowGraphLabelsFor,
    wideFlowEdges,
    wideFlowNodes,
  } from './flow-graph.fixtures';

  const labels = $derived(flowGraphLabelsFor($locale));

  const nodes = wideFlowNodes();
  const edges = wideFlowEdges();
</script>

<div class="nds-stack nds-max-w-md" data-spacing="lg">
  <div data-testid="flow-graph-default-columns">
    <FlowGraph {nodes} {edges} status="running" {labels} />
  </div>
  <div data-testid="flow-graph-tight-columns" data-tight>
    <FlowGraph {nodes} {edges} status="running" {labels} />
  </div>
</div>

<style>
  /* A largura MÍNIMA de coluna, na folha de quem consome. */
  [data-tight] :global(.nds-flow-graph) {
    --flow-graph-column-min: var(--spacing-16);
  }
</style>
