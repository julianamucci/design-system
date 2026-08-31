<script lang="ts">
  /**
   * Andaime da pilha dos três níveis.
   *
   * A lista sai de `BUDGET_LEVELS`, e não de três linhas escritas à mão: nível
   * novo no primitivo compartilhado entra na story sozinho. Num `*.stories.ts`
   * não há onde escrever a repetição, e todo export nomeado dali vira story:
   * daí este invólucro.
   *
   * O TETO É O MESMO nos três, de propósito: assim a diferença entre as fotos é
   * o uso, e não a escala. A cor da moldura e do medidor é a única diferença
   * visual entre eles, e é por isso que a palavra do nível está sempre na faixa
   * — duas superfícies coloridas ainda são zero palavras.
   *
   * O horizonte é lido do idioma na própria marcação, e não guardado numa
   * variável: a barra de idioma do Storybook o troca com a story montada.
   */
  import { BUDGET_LEVELS } from '@shared/primitives/token-budget';
  import { locale } from '@/lib/i18n';
  import { QuotaBanner, type QuotaBannerLabels } from './index';
  import { quotaOf, renewalOfFor } from './quota-banner.fixtures';

  const {
    labels,
  }: {
    labels: QuotaBannerLabels;
  } = $props();
</script>

<div class="nds-stack nds-max-w-lg" data-spacing="md">
  {#each BUDGET_LEVELS as level (level)}
    <QuotaBanner
      quota={quotaOf(level)}
      renewsIn={renewalOfFor($locale, level)}
      {labels}
    />
  {/each}
</div>
