<script lang="ts">
  /**
   * Andaime da composição com a linha do estado da execução.
   *
   * As duas são IRMÃS num invólucro, e não pai e filha: uma diz em que pé está a
   * resposta inteira e carrega as ações de parar e repetir, a outra mostra onde o
   * agente está tocando agora. Se fossem uma coisa só, haveria dois botões de
   * parar na tela para uma execução — e quem apertasse um não saberia qual parou.
   *
   * Num `*.stories.ts` não há onde escrever essa marcação, e a tela entra por
   * `{#snippet}`, que só existe dentro de marcação: daí este invólucro.
   */
  import {
    COMPUTER_STEPS_LOGIN,
    COMPUTER_URL,
  } from '@shared/primitives/computer-use-examples';
  import { AgentStatus } from '@/components/ui/agent-status';
  import {
    agentStatusLabelsFor,
    elapsedOf,
  } from '@/components/ui/agent-status/agent-status.fixtures';
  import { locale } from '@/lib/i18n';
  import { ComputerUse } from './index';
  import ComputerUseDemoScreen from './ComputerUseDemoScreen.svelte';
  import { computerUseLabelsFor } from './computer-use.fixtures';

  const labels = $derived(computerUseLabelsFor($locale));
  const runLabels = $derived(agentStatusLabelsFor($locale));
</script>

{#snippet screen()}
  <ComputerUseDemoScreen />
{/snippet}

<div class="nds-stack nds-max-w-md" data-spacing="sm">
  <AgentStatus status="running" elapsed={elapsedOf('running')} labels={runLabels} />
  <ComputerUse
    url={COMPUTER_URL}
    {screen}
    steps={COMPUTER_STEPS_LOGIN}
    activeIndex={3}
    status="running"
    {labels}
  />
</div>
