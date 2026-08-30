<script lang="ts">
  /**
   * Andaime das stories de composição da fila.
   *
   * A fila e o campo são IRMÃOS num invólucro, e não pai e filho: é assim que a
   * peça se usa, e é o que prova que nada precisou ser acrescentado ao campo.
   * Num `*.stories.ts` não há onde escrever essa marcação, e todo export nomeado
   * dali vira story: daí este invólucro.
   *
   * Os rótulos são derivados do idioma, e não montados uma vez: a barra de
   * idioma do Storybook troca o idioma com a story montada, e tanto o nome dos
   * controles quanto a palavra de cada estado são texto de interface.
   */
  import { locale } from '@/lib/i18n';
  import { Composer } from '@/components/ui/composer';
  import type { QueuedMessage } from '@shared/primitives/chat-protocol';
  import { MessageQueue } from './index';
  import { composerLabelsFor, queueLabelsFor } from './message-queue.fixtures';

  const {
    messages,
    onWithdraw,
  }: {
    /** As mensagens que esperam, na ordem em que saem. */
    messages: QueuedMessage[];
    onWithdraw?: (message: QueuedMessage) => void;
  } = $props();

  const labels = $derived(composerLabelsFor($locale));
  const queueLabels = $derived(queueLabelsFor($locale));
</script>

<div class="nds-stack nds-max-w-lg" data-spacing="xs">
  <MessageQueue labels={queueLabels} {messages} {onWithdraw} />
  <Composer {labels} />
</div>
