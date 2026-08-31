<script lang="ts">
  /**
   * Andaime da composição com a linha do estado da execução.
   *
   * As duas são IRMÃS num invólucro, e não pai e filha: cada uma responde a uma
   * pergunta — em que pé está a resposta que se escreve agora, e o quanto andou
   * uma tarefa que sobrevive a ela —, e aninhá-las faria a segunda parecer
   * detalhe da primeira. Num `*.stories.ts` não há onde escrever essa marcação,
   * e todo export nomeado dali vira story: daí este invólucro.
   *
   * A resposta já terminou e o trabalho continua correndo — o par que mostra por
   * que os dois escopos são separados: se fossem um só, este estado não teria
   * como ser escrito.
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
  import { JobProgress, type JobProgressIntent, type JobProgressLabels } from './index';
  import { JOB_COUNT } from './job-progress.fixtures';

  const {
    label,
    labels,
    onAction,
  }: {
    label: string;
    labels: JobProgressLabels;
    onAction?: (intent: JobProgressIntent) => void;
  } = $props();

  const runLabels = $derived(agentStatusLabelsFor($locale));
</script>

<div class="nds-stack nds-max-w-lg" data-spacing="lg">
  <AgentStatus status="complete" elapsed={elapsedOf('complete')} labels={runLabels} />
  <JobProgress {label} status="running" count={JOB_COUNT} {labels} {onAction} />
</div>
