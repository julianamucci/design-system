<script lang="ts">
  /**
   * Andaime do Playground do andamento de trabalho longo.
   *
   * Os rótulos são derivados do idioma, e não montados uma vez: a barra de
   * idioma do Storybook troca o idioma com a story montada, e a palavra de cada
   * estado é texto de interface. Sem o invólucro, o `render` montaria os rótulos
   * no idioma em que a story abriu e eles ficariam para trás na troca.
   *
   * O invólucro também é onde o campo numérico vazio vira AUSÊNCIA de conta:
   * sem o número já feito não há o que escrever, e a peça deixa de desenhar a
   * linha em vez de desenhar um vão. Total zero é ausência pelo mesmo motivo, e
   * quem responde por ele é o vocabulário compartilhado — aqui ele nem chega,
   * porque ensinar `total: 0` seria ensinar um denominador que ninguém pode
   * dividir.
   */
  import { locale } from '@/lib/i18n';
  import type { JobCount, RunStatus } from '@shared/primitives/chat-protocol';
  import { JobProgress, type JobProgressIntent } from './index';
  import { jobLabelFor, jobProgressLabelsFor } from './job-progress.fixtures';

  const {
    status,
    done,
    total,
    onAction,
  }: {
    /** Em que pé está o trabalho. Decide a palavra, a barra, o ocupado e a ação. */
    status: RunStatus;
    /** Quantas unidades já foram feitas. */
    done: number;
    /** De quantas. Zero é ausência, e não um denominador. */
    total: number;
    onAction?: (intent: JobProgressIntent) => void;
  } = $props();

  const labels = $derived(jobProgressLabelsFor($locale));
  const label = $derived(jobLabelFor($locale));

  const count: JobCount | undefined = $derived(
    Number.isFinite(done) ? { done, total: total ? total : undefined } : undefined,
  );
</script>

<JobProgress {label} {status} {count} {labels} {onAction} />
