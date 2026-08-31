<script lang="ts">
  /**
   * Andaime da grade dos três níveis.
   *
   * A lista sai de `BUDGET_LEVELS`, e não de três linhas escritas à mão: nível
   * novo no primitivo compartilhado entra na story sozinho. Num `*.stories.ts`
   * não há onde escrever a repetição, e todo export nomeado dali vira story:
   * daí este invólucro.
   *
   * As props são as MESMAS da peça, menos as que a grade decide sozinha: o
   * arquivo de stories é tipado pelo componente, e um invólucro com vocabulário
   * próprio deixaria de caber ali.
   */
  import { BUDGET_LEVELS } from '@shared/primitives/token-budget';
  import { ContextDisplay, type ContextDisplayLabels } from './index';
  import { usageOf } from './context-display.fixtures';

  const {
    labels,
  }: {
    labels: ContextDisplayLabels;
  } = $props();
</script>

<div class="nds-stack nds-max-w-lg" data-spacing="md">
  {#each BUDGET_LEVELS as level (level)}
    <ContextDisplay usage={usageOf(level)} {labels} />
  {/each}
</div>
