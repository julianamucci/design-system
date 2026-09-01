<script lang="ts">
  /**
   * Andaime de uma cascata só — o Playground e a maior parte das stories.
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
   * O INVÓLUCRO É TAMBÉM ONDE O EIXO DO PLAYGROUND VIRA DADO: "quantos trechos
   * entram" vira uma fatia da lista. É recorte de quem consome, e é assim que
   * esta família revela uma cascata aos poucos — a peça não tem contador de
   * revelação.
   *
   * E É ELE QUE PERMITE AFIRMAR QUE NADA FOI DESENHADO. Sem trecho nenhum a
   * peça não desenha marcação — nem moldura, nem camada que rola —, e sem um
   * elemento de fora a asserção não teria a que apontar.
   */
  import type { RunStatus, TraceSpan } from '@shared/primitives/chat-protocol';
  import { TRACE_SPANS_ORDER } from '@shared/primitives/trace-waterfall-examples';
  import { locale } from '@/lib/i18n';
  import { TraceWaterfall } from './index';
  import { traceWaterfallLabelsFor } from './trace-waterfall.fixtures';

  const {
    spans = TRACE_SPANS_ORDER,
    totalMs,
    revealed,
    status = 'running',
    hostClass,
    testid,
  }: {
    /** Os trechos, na ordem em que devem ser ouvidos. */
    spans?: readonly TraceSpan[];
    /** O eixo, em milissegundos. */
    totalMs: number;
    /** Quantos trechos entram. Ausente é "todos os que vieram". */
    revealed?: number;
    /** Em que pé está a execução que escreve o rastro. */
    status?: RunStatus;
    /** Teto de largura, quando o assunto da story é a rolagem. */
    hostClass?: string;
    /** O endereço que a `play` usa para apontar para o invólucro. */
    testid?: string;
  } = $props();

  const labels = $derived(traceWaterfallLabelsFor($locale));
  const shownSpans = $derived(revealed === undefined ? spans : spans.slice(0, revealed));
</script>

<div class={hostClass} data-testid={testid}>
  <TraceWaterfall spans={shownSpans} {totalMs} {status} {labels} />
</div>
