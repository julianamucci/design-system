<script lang="ts">
  /**
   * O indicador entre a conversa e o campo que já oferece interromper.
   *
   * As duas peças falam da mesma espera e não se repetem: uma diz que a
   * resposta vem, a outra oferece o que fazer a respeito.
   */
  import { locale } from '@/lib/i18n';
  import { ChatThread } from '@/components/ui/chat-thread';
  import { chatThreadLabelsFor } from '@/components/ui/chat-thread/chat-thread.fixtures';
  import { Composer } from '@/components/ui/composer';
  import { composerLabelsFor } from '@/components/ui/composer/composer.fixtures';
  import { ThinkingIndicator } from './index';
  import { askedMessages, indicatorLabelsFor } from './thinking-indicator.fixtures';

  const labels = $derived(indicatorLabelsFor($locale));
  const threadLabels = $derived(chatThreadLabelsFor($locale));
  const composerLabels = $derived(composerLabelsFor($locale));

  const messages = askedMessages();
</script>

<div class="nds-stack nds-max-w-lg" data-spacing="sm">
  <ChatThread {messages} labels={threadLabels} size="xs" />
  <ThinkingIndicator label={labels.generating} />
  <!--
    O campo é quem oferece o que fazer a respeito da espera. O indicador não
    duplica esse controle: ele diz que a resposta vem, e nada mais.
  -->
  <Composer labels={composerLabels} running />
</div>
