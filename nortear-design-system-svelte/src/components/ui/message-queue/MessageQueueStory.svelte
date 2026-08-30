<script lang="ts">
  /**
   * Andaime do Playground da fila.
   *
   * Os dois controles da story — o estado e o texto — NÃO são props da fila:
   * são os eixos de UMA mensagem dentro dela. Nesta stack os args da story
   * precisam servir ao componente que o `render` devolve, e a fila não tem prop
   * chamada "estado"; sem o invólucro, o andaime da story vazaria para a API do
   * componente só para o tipo fechar.
   *
   * Os rótulos são derivados do idioma, e não montados uma vez: a barra de
   * idioma do Storybook troca o idioma com a story montada, e a palavra de cada
   * estado é texto de interface.
   */
  import { locale } from '@/lib/i18n';
  import type { QueuedMessage, QueuedMessageState } from '@shared/primitives/chat-protocol';
  import { MessageQueue } from './index';
  import { queueLabelsFor } from './message-queue.fixtures';

  const {
    state,
    text,
    onWithdraw,
  }: {
    /** Em que ponto a mensagem está. Decide quem oferece retirar. */
    state: QueuedMessageState;
    /** O que foi escrito. É ele que entra no botão que a retira. */
    text: string;
    onWithdraw?: (message: QueuedMessage) => void;
  } = $props();

  const labels = $derived(queueLabelsFor($locale));

  const messages = $derived<QueuedMessage[]>([{ id: 'm1', text, state }]);
</script>

<MessageQueue {labels} {messages} {onWithdraw} class="nds-max-w-lg" />
