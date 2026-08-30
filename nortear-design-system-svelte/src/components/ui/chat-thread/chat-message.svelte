<script lang="ts">
  /** Uma mensagem da conversa. */
  import { Markdown } from '@/components/ui/markdown';
  import ChatDisclosure from './chat-disclosure.svelte';
  import ChatSources from './chat-sources.svelte';
  import ChatToolCall from './chat-tool-call.svelte';
  import type { ChatMessage, ChatThreadLabels } from './chat-thread.svelte';

  const { message, labels }: { message: ChatMessage; labels: ChatThreadLabels } = $props();
</script>

<!--
  Ocupada enquanto gera, e NÃO região viva: anunciar a cada trecho tornaria a
  conversa impossível de ouvir. Quem anuncia o resultado é o anunciador da
  thread, uma vez, quando a mensagem termina.
-->
<li
  class="nds-chat-message"
  data-slot="chat-message"
  data-role={message.role}
  data-message-id={message.id}
  aria-busy={message.streaming ? 'true' : undefined}
>
  {#if message.avatar}
    <div class="nds-chat-message-avatar">{@render message.avatar()}</div>
  {/if}

  <div class="nds-chat-message-body">
    {#if message.author || message.time}
      <div class="nds-chat-message-header">
        {#if message.author}<span class="nds-chat-message-author">{message.author}</span>{/if}
        {#if message.time}<time>{message.time}</time>{/if}
      </div>
    {/if}

    <!--
      O raciocínio vem ANTES da resposta, fechado: é o caminho, e quem lê quer o
      destino primeiro.
    -->
    {#if message.reasoning}
      <ChatDisclosure kind="reasoning" summary={labels.reasoning}>
        {message.reasoning}
      </ChatDisclosure>
    {/if}

    <div class="nds-chat-message-tools">
      {#each message.toolCalls ?? [] as call, i (call.id ?? i)}
        <ChatToolCall {call} {labels} />
      {/each}
    </div>

    <div class="nds-chat-message-content">
      <Markdown content={message.content} streaming={message.streaming} />
    </div>

    {#if message.sources?.length}
      <ChatSources sources={message.sources} title={labels.sources} />
    {/if}

    {#if message.actions}
      <div class="nds-chat-message-actions">{@render message.actions()}</div>
    {/if}
  </div>
</li>
