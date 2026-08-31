<script lang="ts">
  /**
   * Andaime da grade dos três estados.
   *
   * A lista sai de `CONNECTION_STATES`, e não de três linhas escritas à mão:
   * estado novo no vocabulário compartilhado entra na story sozinho, que é
   * exatamente o que aquela constante existe para garantir. Num `*.stories.ts`
   * não há onde escrever a repetição, e todo export nomeado dali vira story:
   * daí este invólucro.
   *
   * A MESMA contagem vai para os três, de propósito. É o que faz a grade provar
   * a decisão 3 da folha em vez de só ilustrá-la: a peça recusa desenhá-la onde
   * nenhuma tentativa está marcada, e a recusa é do vocabulário compartilhado,
   * não deste andaime.
   *
   * As props são as MESMAS da peça, menos as que a grade decide sozinha: o
   * arquivo de stories é tipado pelo componente, e um invólucro com vocabulário
   * próprio deixaria de caber ali.
   */
  import { CONNECTION_STATES } from '@shared/primitives/chat-protocol';
  import { ConnectionState, type ConnectionStateLabels } from './index';
  import { CONNECTION_COUNTDOWN } from './connection-state.fixtures';

  const {
    labels,
    onRetry,
  }: {
    labels: ConnectionStateLabels;
    onRetry?: () => void;
  } = $props();
</script>

<div class="nds-stack nds-w-full" data-spacing="md">
  {#each CONNECTION_STATES as state (state)}
    <ConnectionState {state} countdown={CONNECTION_COUNTDOWN} {labels} {onRetry} />
  {/each}
</div>
