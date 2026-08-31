<script lang="ts">
  /**
   * Andaime do Playground do estado da ligação.
   *
   * Os rótulos são derivados do idioma, e não montados uma vez: a barra de
   * idioma do Storybook troca o idioma com a story montada, e a palavra de cada
   * estado é texto de interface. Sem o invólucro, o `render` montaria os
   * rótulos no idioma em que a story abriu e eles ficariam para trás na troca.
   *
   * O invólucro também é onde o campo de texto vazio vira AUSÊNCIA de contagem:
   * uma string vazia desenharia um vão sem número.
   */
  import { locale } from '@/lib/i18n';
  import type { ConnectionState as ConnectionStateValue } from '@shared/primitives/chat-protocol';
  import { ConnectionState } from './index';
  import { connectionStateLabelsFor } from './connection-state.fixtures';

  const {
    state,
    countdown,
    onRetry,
  }: {
    /** Em que pé está a ligação. Decide a palavra, o ponto, a contagem e a ação. */
    state: ConnectionStateValue;
    /** Quanto falta para a próxima tentativa, já escrito. */
    countdown: string;
    onRetry?: () => void;
  } = $props();

  const labels = $derived(connectionStateLabelsFor($locale));
</script>

<ConnectionState {state} countdown={countdown || undefined} {labels} {onRetry} />
