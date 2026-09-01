<script lang="ts">
  /**
   * Andaime da grade dos cinco estados.
   *
   * A lista sai de `RUN_STATUSES`, e não de cinco linhas escritas à mão: estado
   * novo no vocabulário compartilhado entra na story sozinho, que é exatamente o
   * que aquela constante existe para garantir. Num `*.stories.ts` não há onde
   * escrever a repetição — e a tela entra por `{#snippet}`, que só existe dentro
   * de marcação: daí este invólucro.
   *
   * A TELA É NOVA A CADA PEÇA, e tem de ser. O `{#snippet}` é renderizado uma vez
   * por moldura, e cada renderização monta a sua — é o que impede as cinco fotos
   * de disputarem a mesma tela.
   */
  import { RUN_STATUSES } from '@shared/primitives/chat-protocol';
  import {
    COMPUTER_STEPS_LOGIN,
    COMPUTER_URL,
  } from '@shared/primitives/computer-use-examples';
  import { locale } from '@/lib/i18n';
  import { ComputerUse } from './index';
  import ComputerUseDemoScreen from './ComputerUseDemoScreen.svelte';
  import { computerUseLabelsFor } from './computer-use.fixtures';

  const labels = $derived(computerUseLabelsFor($locale));
</script>

{#snippet screen()}
  <ComputerUseDemoScreen />
{/snippet}

<div class="nds-stack nds-max-w-md" data-spacing="lg">
  {#each RUN_STATUSES as status (status)}
    <ComputerUse
      url={COMPUTER_URL}
      {screen}
      steps={COMPUTER_STEPS_LOGIN}
      activeIndex={3}
      {status}
      {labels}
    />
  {/each}
</div>
