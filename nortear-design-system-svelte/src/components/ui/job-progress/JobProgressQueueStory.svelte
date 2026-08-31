<script lang="ts">
  /**
   * Andaime da fila de trabalhos.
   *
   * A fila é de quem consome: a peça desenha UM trabalho, e empilhá-las é o que
   * produz a fila. Uma peça que recebesse a lista decidiria ordenação e
   * agrupamento, que são política de produto. Num `*.stories.ts` não há onde
   * escrever a pilha, e todo export nomeado dali vira story: daí este invólucro.
   *
   * Os três estados são escolhidos para cobrir os três graus de conhecimento
   * sobre a conta: com total, sem total, e sem conta nenhuma.
   */
  import { JobProgress, type JobProgressIntent, type JobProgressLabels } from './index';
  import { JOB_COUNT, JOB_COUNT_WITHOUT_TOTAL } from './job-progress.fixtures';

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

<div class="nds-stack nds-max-w-lg" data-spacing="lg">
  <JobProgress {label} status="running" count={JOB_COUNT} {labels} {onAction} />
  <JobProgress
    {label}
    status="running"
    count={JOB_COUNT_WITHOUT_TOTAL}
    {labels}
    {onAction}
  />
  <!--
    O que espera não traz conta, e a trilha vazia é a verdade dele: aqui zero não
    mente, porque nada começou. É o outro lado da decisão 5 da folha — o traço
    correndo é do que ANDA sem estimativa, e não do que ainda não saiu da fila.
  -->
  <JobProgress {label} status="idle" {labels} {onAction} />
</div>
