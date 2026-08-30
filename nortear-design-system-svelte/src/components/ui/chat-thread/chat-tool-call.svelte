<script lang="ts">
  import ChatDisclosure from './chat-disclosure.svelte';
  import type { ChatThreadLabels, ChatToolCall } from './chat-thread.svelte';

  const { call, labels }: { call: ChatToolCall; labels: ChatThreadLabels } = $props();
</script>

<!--
  O estado vai no atributo E no texto do resumo: cor sozinha não descreve estado
  para quem não a percebe.

  A chamada que espera por uma pessoa nasce ABERTA — pedir autorização dentro de
  uma caixa fechada é pedir sem mostrar.
-->
<ChatDisclosure
  kind="tool-call"
  summary={`${call.name} · ${labels.toolState[call.state]}`}
  data-state={call.state}
  data-call-id={call.id}
  open={call.state === 'pending'}
>
  {call.detail ?? ''}
  {#if call.approval}
    <div class="nds-chat-tool-call-approval">{@render call.approval()}</div>
  {/if}
</ChatDisclosure>
