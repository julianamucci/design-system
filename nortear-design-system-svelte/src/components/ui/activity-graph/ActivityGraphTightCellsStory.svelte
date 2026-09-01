<script lang="ts">
  /**
   * Andaime do tamanho da casa, apertado por quem consome.
   *
   * É a única superfície de customização da peça, e é ela que decide quando
   * a grade passa a rolar. Entra por propriedade personalizada na folha de
   * quem monta, e nunca por largura em `style`.
   *
   * E "a folha dele", nesta stack, é um bloco de estilo escopado. A
   * distinção não é de gosto: a folha DECLARA `--activity-graph-cell` e
   * `--activity-graph-gap` no próprio `.nds-activity-graph`, e declaração no
   * elemento vence valor herdado. Pôr a propriedade num invólucro ficaria
   * sem efeito nenhum, e a story fotografaria o tamanho padrão achando que
   * fotografa o apertado — portão sem dentes. Por isso a regra sai daqui com
   * especificidade maior, escopada ao invólucro para não vazar para o resto
   * da página. É o mesmo caminho que o snippet do painel Code ensina a quem
   * consome.
   *
   * OS DOIS LADO A LADO, e é o único jeito de a asserção medir alguma coisa:
   * o valor da propriedade lido por `getPropertyValue` é o ESPECIFICADO, e
   * num token declarado por `calc()` ele volta como a expressão, não como o
   * pixel. O que compara de verdade é a largura da caixa, e para comparar é
   * preciso haver duas.
   */
  import { locale } from '@/lib/i18n';
  import { ActivityGraph } from './index';
  import {
    activityGraphLabelsFor,
  } from './activity-graph.fixtures';
  import {
    ACTIVITY_DAYS,
    ACTIVITY_MONTH_END,
    ACTIVITY_MONTH_START,
    ACTIVITY_THRESHOLDS,
  } from '@shared/primitives/activity-graph-examples';

  const labels = $derived(activityGraphLabelsFor($locale));
</script>

<div class="nds-stack nds-w-full" data-spacing="lg">
  <div data-testid="activity-graph-default-cells">
    <ActivityGraph
      days={ACTIVITY_DAYS}
      start={ACTIVITY_MONTH_START}
      end={ACTIVITY_MONTH_END}
      thresholds={ACTIVITY_THRESHOLDS}
      status="complete"
      {labels}
    />
  </div>
  <div data-testid="activity-graph-tight-cells" data-tight>
    <ActivityGraph
      days={ACTIVITY_DAYS}
      start={ACTIVITY_MONTH_START}
      end={ACTIVITY_MONTH_END}
      thresholds={ACTIVITY_THRESHOLDS}
      status="complete"
      {labels}
    />
  </div>
</div>

<style>
  /* O tamanho da casa e o vão, na folha de quem consome. */
  [data-tight] :global(.nds-activity-graph) {
    --activity-graph-cell: var(--spacing-2);
    --activity-graph-gap: var(--spacing-px);
  }
</style>
