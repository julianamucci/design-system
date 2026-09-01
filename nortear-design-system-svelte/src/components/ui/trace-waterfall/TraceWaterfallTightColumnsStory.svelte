<script lang="ts">
  /**
   * Andaime da largura mínima do nome, apertada por quem consome.
   *
   * É a única superfície de customização da peça, e é ela que decide quando
   * a cascata passa a rolar. Entra por propriedade personalizada na folha de
   * quem monta, e nunca por largura em `style`.
   *
   * E "a folha dele", nesta stack, é um bloco de estilo escopado. A distinção
   * não é de gosto: a folha DECLARA `--trace-waterfall-name-min` no próprio
   * `.nds-trace-waterfall`, e declaração no elemento vence valor herdado. Pôr
   * a propriedade num invólucro ficaria sem efeito nenhum, e a story
   * fotografaria a largura padrão achando que fotografa a apertada — portão
   * sem dentes. Por isso a regra sai daqui com especificidade maior, escopada
   * ao invólucro para não vazar para o resto da página. É o mesmo caminho que
   * o snippet do painel Code ensina a quem consome.
   *
   * OS DOIS LADO A LADO, e é o único jeito de a asserção medir alguma coisa: o
   * valor da propriedade lido por `getPropertyValue` é o ESPECIFICADO, e num
   * token declarado por `calc()` ele volta como a expressão, não como o
   * pixel. O que compara de verdade é a largura da caixa, e para comparar é
   * preciso haver duas.
   *
   * RÓTULOS CURTOS, e não os do rastro de referência: a coluna do nome é
   * `max-content` com um piso, e o piso só decide a largura quando o
   * conteúdo é mais estreito que ele.
   */
  import { locale } from '@/lib/i18n';
  import { TraceWaterfall } from './index';
  import {
    SHORT_LABEL_SPANS,
    SHORT_LABEL_TOTAL_MS,
    traceWaterfallLabelsFor,
  } from './trace-waterfall.fixtures';

  const labels = $derived(traceWaterfallLabelsFor($locale));
</script>

<div class="nds-stack nds-max-w-md" data-spacing="lg">
  <div data-testid="trace-waterfall-default-columns">
    <TraceWaterfall spans={SHORT_LABEL_SPANS} totalMs={SHORT_LABEL_TOTAL_MS} status="running" {labels} />
  </div>
  <div data-testid="trace-waterfall-tight-columns" data-tight>
    <TraceWaterfall spans={SHORT_LABEL_SPANS} totalMs={SHORT_LABEL_TOTAL_MS} status="running" {labels} />
  </div>
</div>

<style>
  /* A largura MÍNIMA do nome, na folha de quem consome. */
  [data-tight] :global(.nds-trace-waterfall) {
    --trace-waterfall-name-min: var(--spacing-8);
  }
</style>
