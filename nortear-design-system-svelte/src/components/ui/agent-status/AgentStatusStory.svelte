<script lang="ts">
  /**
   * Andaime do Playground do estado da execução.
   *
   * Os rótulos são derivados do idioma, e não montados uma vez: a barra de
   * idioma do Storybook troca o idioma com a story montada, e a palavra de cada
   * estado é texto de interface. Sem o invólucro, o `render` montaria os
   * rótulos no idioma em que a story abriu e eles ficariam para trás na troca.
   *
   * O invólucro também é onde o campo de texto vazio vira AUSÊNCIA de relógio:
   * uma string vazia desenharia um vão sem número.
   */
  import { locale } from '@/lib/i18n';
  import type { RunStatus } from '@shared/primitives/chat-protocol';
  import { AgentStatus, type AgentStatusIntent } from './index';
  import { agentStatusLabelsFor } from './agent-status.fixtures';

  const {
    status,
    elapsed,
    onAction,
  }: {
    /** Em que pé está a execução. Decide a palavra, o ponto e a ação. */
    status: RunStatus;
    /** Há quanto tempo a execução corre, já escrito. */
    elapsed: string;
    onAction?: (intent: AgentStatusIntent) => void;
  } = $props();

  const labels = $derived(agentStatusLabelsFor($locale));
</script>

<AgentStatus {status} elapsed={elapsed || undefined} {labels} {onAction} />
