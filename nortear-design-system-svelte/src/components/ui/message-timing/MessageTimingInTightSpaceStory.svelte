<script lang="ts">
  /**
   * Andaime da linha num espaço estreito.
   *
   * O assunto é a AUSÊNCIA de argumento: quem decide a forma é o container, e
   * por isso o container precisa existir em algum lugar. Num `*.stories.ts` não
   * há onde escrever essa marcação, e todo export nomeado dali vira story — daí
   * este invólucro.
   *
   * As props são as MESMAS da peça: um invólucro com vocabulário próprio
   * deixaria de caber no arquivo de stories, que é tipado pelo componente.
   */
  import { MessageTiming, type MessageTimingLabels, type MessageTimingStat } from './index';

  const {
    stats,
    labels,
  }: {
    /** As medições que a linha desenha. */
    stats: readonly MessageTimingStat[];
    labels: MessageTimingLabels;
  } = $props();
</script>

<div class="nds-max-w-3xs">
  <MessageTiming {stats} {labels} />
</div>
