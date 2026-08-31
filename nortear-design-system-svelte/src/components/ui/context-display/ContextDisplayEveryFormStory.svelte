<script lang="ts">
  /**
   * Andaime da grade das três formas.
   *
   * A lista sai de `CONTEXT_DISPLAY_FORMS`, e não de três linhas escritas à
   * mão: forma nova entra na story sozinha, que é exatamente o que aquela
   * constante existe para garantir. Num `*.stories.ts` não há onde escrever a
   * repetição, e todo export nomeado dali vira story: daí este invólucro.
   *
   * As props são as MESMAS da peça, menos as que a grade decide sozinha: o
   * arquivo de stories é tipado pelo componente, e um invólucro com vocabulário
   * próprio deixaria de caber ali.
   */
  import type { TokenUsage } from '@shared/primitives/chat-protocol';
  import { CONTEXT_DISPLAY_FORMS, ContextDisplay, type ContextDisplayLabels } from './index';

  const {
    usage,
    labels,
  }: {
    usage: TokenUsage;
    labels: ContextDisplayLabels;
  } = $props();
</script>

<div class="nds-stack nds-max-w-lg" data-spacing="lg">
  {#each CONTEXT_DISPLAY_FORMS as form (form)}
    <ContextDisplay {usage} {form} {labels} />
  {/each}
</div>
