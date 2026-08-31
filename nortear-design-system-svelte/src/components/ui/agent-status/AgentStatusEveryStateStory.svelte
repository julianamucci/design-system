<script lang="ts">
  /**
   * Andaime da grade dos cinco estados.
   *
   * A lista sai de `RUN_STATUSES`, e não de cinco linhas escritas à mão: estado
   * novo no vocabulário compartilhado entra na story sozinho, que é exatamente
   * o que aquela constante existe para garantir. Num `*.stories.ts` não há onde
   * escrever a repetição, e todo export nomeado dali vira story: daí este
   * invólucro.
   *
   * As props são as MESMAS da peça, menos as que a grade decide sozinha: o
   * arquivo de stories é tipado pelo componente, e um invólucro com vocabulário
   * próprio deixaria de caber ali.
   */
  import { RUN_STATUSES } from '@shared/primitives/chat-protocol';
  import { AgentStatus, type AgentStatusIntent, type AgentStatusLabels } from './index';
  import { elapsedOf } from './agent-status.fixtures';

  const {
    labels,
    onAction,
  }: {
    labels: AgentStatusLabels;
    onAction?: (intent: AgentStatusIntent) => void;
  } = $props();
</script>

<div class="nds-stack nds-w-full" data-spacing="md">
  {#each RUN_STATUSES as status (status)}
    <AgentStatus {status} elapsed={elapsedOf(status)} {labels} {onAction} />
  {/each}
</div>
