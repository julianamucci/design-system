<script lang="ts">
  /**
   * As ações do turno — o que se pode fazer com uma resposta depois de lida.
   *
   * Componente, e não trecho no arquivo de story, porque as ações entram por
   * `{#snippet}`. O espião chega por prop: criado dentro daqui, a play não o
   * alcançaria.
   */
  import { Button } from '@/components/ui/button';
  import { locale } from '@/lib/i18n';
  import { ChatThread } from './index';
  import { chatThreadLabelsFor, toMessages } from './chat-thread.fixtures';
  import { CHAT_COM_FERRAMENTAS } from '@shared/primitives/chat-examples';

  const { onCopy }: { onCopy?: () => void } = $props();

  const labels = $derived(chatThreadLabelsFor($locale));
  const messages = toMessages(CHAT_COM_FERRAMENTAS);
  const last = messages[messages.length - 1];
</script>

{#snippet actions()}
  <Button variant="ghost" size="sm" onclick={onCopy}>Copiar</Button>
  <Button variant="ghost" size="sm">Refazer</Button>
{/snippet}

<ChatThread
  messages={messages.map((m) => (m === last ? { ...m, actions } : m))}
  {labels}
  size="lg"
/>
