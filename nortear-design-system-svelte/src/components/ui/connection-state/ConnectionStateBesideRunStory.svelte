<script lang="ts">
  /**
   * Andaime da composição com a linha do estado da execução.
   *
   * As duas são IRMÃS num invólucro, e não pai e filha: cada uma responde a uma
   * pergunta — se ainda há por onde pedir, e o que o agente está fazendo com o
   * que já foi pedido —, e aninhá-las faria a segunda parecer detalhe da
   * primeira. Num `*.stories.ts` não há onde escrever essa marcação, e todo
   * export nomeado dali vira story: daí este invólucro.
   *
   * A execução parou e a ligação caiu — o par que mostra por que os dois
   * vocabulários são separados: se fossem um só, este estado não teria como ser
   * escrito.
   *
   * Os rótulos da EXECUÇÃO não entram por prop: são derivados do idioma, porque
   * a barra de idioma do Storybook os troca com a story montada.
   */
  import { locale } from '@/lib/i18n';
  import { AgentStatus } from '@/components/ui/agent-status';
  import {
    agentStatusLabelsFor,
    elapsedOf,
  } from '@/components/ui/agent-status/agent-status.fixtures';
  import { ConnectionState, type ConnectionStateLabels } from './index';
  import { CONNECTION_COUNTDOWN } from './connection-state.fixtures';

  const {
    labels,
    onRetry,
  }: {
    labels: ConnectionStateLabels;
    onRetry?: () => void;
  } = $props();

  const runLabels = $derived(agentStatusLabelsFor($locale));
</script>

<div class="nds-stack nds-max-w-lg" data-spacing="sm">
  <ConnectionState
    state="reconnecting"
    countdown={CONNECTION_COUNTDOWN}
    {labels}
    {onRetry}
  />
  <AgentStatus status="stopped" elapsed={elapsedOf('stopped')} labels={runLabels} />
</div>
