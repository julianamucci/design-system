<script lang="ts">
  /**
   * Andaime da grade dos cinco estados.
   *
   * A lista sai de `RUN_STATUSES`, e não de cinco linhas escritas à mão: estado
   * novo no vocabulário compartilhado entra na story sozinho, que é exatamente o
   * que aquela constante existe para garantir. Num `*.stories.ts` não há onde
   * escrever a repetição, e todo export nomeado dali vira story: daí este
   * invólucro.
   *
   * A MESMA conta vai para os cinco, de propósito. É o que faz a grade provar as
   * decisões da folha em vez de só ilustrá-las: com um número só, concluído
   * desenha cheio, interrompido congela onde chegou e em andamento mostra a
   * fração. Quem decide isso é o vocabulário compartilhado, não este andaime.
   */
  import { RUN_STATUSES } from '@shared/primitives/chat-protocol';
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
</script>

<div class="nds-stack nds-w-full" data-spacing="lg">
  {#each RUN_STATUSES as status (status)}
    <JobProgress {label} {status} count={JOB_COUNT} {labels} {onAction} />
  {/each}
</div>
