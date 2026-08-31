<script lang="ts">
  /**
   * Andaime do par sem total conhecido.
   *
   * Duas peças, e as duas dizem a mesma coisa por caminhos diferentes: uma omite
   * o total, a outra manda zero. Zero é o erro mais fácil de cometer, porque
   * parece um número, e é justamente o que desenharia trilha vazia — "acabou de
   * começar" — para algo que já andou muito. Quem trata os dois igual é o
   * vocabulário compartilhado, e não este andaime.
   *
   * Num `*.stories.ts` não há onde escrever duas peças empilhadas, e todo export
   * nomeado dali vira story: daí este invólucro.
   */
  import { JobProgress, type JobProgressIntent, type JobProgressLabels } from './index';
  import { JOB_COUNT_WITHOUT_TOTAL } from './job-progress.fixtures';

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
  <JobProgress
    {label}
    status="running"
    count={JOB_COUNT_WITHOUT_TOTAL}
    {labels}
    {onAction}
  />
  <JobProgress
    {label}
    status="running"
    count={{ done: JOB_COUNT_WITHOUT_TOTAL.done, total: 0 }}
    {labels}
    {onAction}
  />
</div>
