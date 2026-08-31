<script lang="ts">
  /**
   * Andaime da grade dos três níveis.
   *
   * A lista sai de `BUDGET_LEVELS`, e não de três linhas escritas à mão: nível
   * novo no primitivo compartilhado entra na story sozinho. Num `*.stories.ts`
   * não há onde escrever a repetição, e todo export nomeado dali vira story:
   * daí este invólucro.
   *
   * O TETO É O MESMO nos três, de propósito: assim a diferença entre as fotos é
   * o gasto, e não a escala. A cor do medidor é a única diferença visual entre
   * eles, e é por isso que a palavra do nível está sempre na linha.
   *
   * As props são as MESMAS da peça, menos as que a grade decide sozinha: o
   * arquivo de stories é tipado pelo componente, e um invólucro com vocabulário
   * próprio deixaria de caber ali.
   */
  import { BUDGET_LEVELS } from '@shared/primitives/token-budget';
  import { CostMeter, type CostMeterLabels } from './index';
  import { amountOf, budgetOf } from './cost-meter.fixtures';

  const {
    labels,
  }: {
    labels: CostMeterLabels;
  } = $props();
</script>

<div class="nds-stack nds-max-w-lg" data-spacing="md">
  {#each BUDGET_LEVELS as level (level)}
    <CostMeter amount={amountOf(level)} budget={budgetOf(level)} {labels} />
  {/each}
</div>
