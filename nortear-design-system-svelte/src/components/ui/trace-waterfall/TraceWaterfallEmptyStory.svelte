<script lang="ts">
  /**
   * Andaime dos dois casos em que a peça prefere não existir.
   *
   * São DOIS, e pela mesma razão: sem trecho não há cascata, e sem eixo com
   * extensão também não há onde posicionar nada. Devolver uma moldura vazia
   * seria pior que não desenhar nada — a camada que rola é parada de teclado,
   * e uma parada que leva a uma caixa vazia é ruído com nome.
   *
   * Os dois hosts moram no MESMO invólucro, e não em duas stories, porque o
   * assunto da story é justamente que nenhum dos dois desenha nada — duas
   * fotos de nada não ensinam mais que uma.
   */
  import { locale } from '@/lib/i18n';
  import { TraceWaterfall } from './index';
  import { traceWaterfallLabelsFor } from './trace-waterfall.fixtures';
  import { TRACE_SPANS_ORDER, TRACE_TOTAL_MS } from '@shared/primitives/trace-waterfall-examples';

  const labels = $derived(traceWaterfallLabelsFor($locale));
</script>

<div class="nds-stack nds-w-full" data-spacing="lg">
  <div data-testid="trace-waterfall-empty-host">
    <TraceWaterfall spans={[]} totalMs={TRACE_TOTAL_MS} status="idle" {labels} />
  </div>
  <div data-testid="trace-waterfall-no-axis-host">
    <TraceWaterfall spans={TRACE_SPANS_ORDER} totalMs={0} status="idle" {labels} />
  </div>
</div>
