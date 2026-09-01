<script lang="ts">
  /**
   * Andaime da régua dos quatro estados de trecho.
   *
   * A lista sai de `TOOL_CALL_STATES`, e não de quatro trechos escritos à
   * mão: estado novo no vocabulário compartilhado entra na story sozinho, e
   * ninguém precisa lembrar de mexer aqui.
   *
   * O RÓTULO DE CADA TRECHO É A PALAVRA DO ESTADO, e por isso ele também é
   * derivado do idioma: a régua fotografa a diferença entre os quatro
   * desenhos, e um rótulo preso ao idioma de abertura mostraria a foto errada
   * depois da troca.
   *
   * O estado é do TRECHO, e não da peça — o que a peça tem é o estado da
   * execução que a escreve, e ele decide uma coisa só: se ela se declara
   * ocupada. Por isso esta régua tem quatro trechos, e não quatro cascatas.
   */
  import { TOOL_CALL_STATES, type TraceSpan } from '@shared/primitives/chat-protocol';
  import { locale } from '@/lib/i18n';
  import { TraceWaterfall } from './index';
  import { traceWaterfallLabelsFor } from './trace-waterfall.fixtures';

  const labels = $derived(traceWaterfallLabelsFor($locale));

  const spans = $derived(
    TOOL_CALL_STATES.map((state, index): TraceSpan => ({
      id: state,
      label: labels.state[state],
      startMs: index * 280,
      durationMs: 240,
      depth: 0,
      state,
    })),
  );
</script>

<!--
  A EXECUÇÃO JÁ TERMINOU: é o par desta régua, e o que ela mostra é que a peça
  deixa de se declarar ocupada sem apagar estado de trecho nenhum.
-->
<TraceWaterfall {spans} totalMs={1200} status="complete" {labels} />
