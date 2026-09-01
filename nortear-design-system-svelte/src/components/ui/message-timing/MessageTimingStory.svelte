<script lang="ts">
  /**
   * Andaime do Playground do tempo da resposta.
   *
   * Os rótulos e as medidas são derivados do idioma, e não montados uma vez: a
   * barra de idioma do Storybook troca o idioma com a story montada, e tanto o
   * nome de cada medida quanto o separador decimal do número são texto de
   * interface. Sem o invólucro, o `render` escreveria as medidas no idioma em
   * que a story abriu e elas ficariam para trás na troca.
   *
   * O invólucro também é onde o control de CONTAGEM vira uma lista: o corte sai
   * da MESMA lista completa, e não de quatro listas diferentes, porque é assim
   * que a story prova que a ordem é preservada em qualquer contagem.
   */
  import { locale } from '@/lib/i18n';
  import { MessageTiming } from './index';
  import { messageTimingLabelsFor, statsOfFor } from './message-timing.fixtures';

  const {
    measures,
    streaming,
  }: {
    /** Quantas das medidas do exemplo chegaram. */
    measures: number;
    /** A medição ainda está andando? */
    streaming: boolean;
  } = $props();

  const labels = $derived(messageTimingLabelsFor($locale));
  const stats = $derived(statsOfFor($locale, 'settled').slice(0, measures));
</script>

<MessageTiming {stats} {streaming} {labels} />
