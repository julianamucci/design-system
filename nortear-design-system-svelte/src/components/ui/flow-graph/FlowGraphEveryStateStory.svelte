<script lang="ts">
  /**
   * Andaime da grade dos quatro estados de nó.
   *
   * A lista sai de `TOOL_CALL_STATES`, e não de quatro nós escritos à mão:
   * estado novo no vocabulário compartilhado entra na story sozinho, e ninguém
   * precisa lembrar de mexer aqui.
   *
   * O RÓTULO DE CADA NÓ É A PALAVRA DO ESTADO, e por isso ele também é derivado
   * do idioma: a grade fotografa a diferença entre os quatro desenhos, e um
   * rótulo preso ao idioma de abertura mostraria a foto errada depois da troca.
   *
   * O estado é do NÓ, e não da peça — o que a peça tem é o estado da execução
   * que a escreve, e ele decide uma coisa só: se ela se declara ocupada. Por
   * isso esta grade tem quatro nós, e não quatro grafos.
   */
  import {
    TOOL_CALL_STATES,
    type FlowEdge,
    type FlowNode,
  } from '@shared/primitives/chat-protocol';
  import { locale } from '@/lib/i18n';
  import { FlowGraph } from './index';
  import { flowGraphLabelsFor } from './flow-graph.fixtures';

  const labels = $derived(flowGraphLabelsFor($locale));

  const nodes = $derived(
    TOOL_CALL_STATES.map((state, index): FlowNode => ({
      id: state,
      label: labels.state[state],
      column: index,
      row: 0,
      state,
    })),
  );

  const edges: readonly FlowEdge[] = TOOL_CALL_STATES.slice(1).map((state, index) => ({
    from: TOOL_CALL_STATES[index],
    to: state,
  }));
</script>

<!--
  A EXECUÇÃO JÁ TERMINOU: é o par desta grade, e o que ela mostra é que a peça
  deixa de se declarar ocupada sem apagar estado de nó nenhum.
-->
<FlowGraph {nodes} {edges} status="complete" {labels} />
