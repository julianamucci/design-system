<script lang="ts">
  /**
   * Andaime da composição com a linha do estado da execução.
   *
   * As duas são IRMÃS num invólucro, e não pai e filha: uma diz em que pé está a
   * resposta inteira e carrega as ações de parar e repetir, a outra mostra o que
   * um comando dentro dela escreveu. Se fossem uma coisa só, haveria dois botões
   * de parar na tela para uma execução — e quem apertasse um não saberia qual
   * parou. Num `*.stories.ts` não há onde escrever essa marcação, e todo export
   * nomeado dali vira story: daí este invólucro.
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
  import { TerminalBlock, type TerminalBlockLabels } from './index';
  import { linesFor } from './terminal-block.fixtures';

  const {
    command,
    labels,
  }: {
    /** O que foi executado. Igual em toda foto, e vindo de fora como na peça. */
    command: string;
    labels: TerminalBlockLabels;
  } = $props();

  const runLabels = $derived(agentStatusLabelsFor($locale));
</script>

<div class="nds-stack nds-max-w-lg" data-spacing="lg">
  <AgentStatus status="running" elapsed={elapsedOf('running')} labels={runLabels} />
  <TerminalBlock
    {command}
    lines={linesFor('running')}
    status="running"
    {labels}
  />
</div>
