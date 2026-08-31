<script lang="ts">
  /**
   * Andaime do Playground da faixa de cota.
   *
   * Os rótulos e o HORIZONTE são derivados do idioma, e não montados uma vez: a
   * barra de idioma do Storybook troca o idioma com a story montada, a palavra
   * de cada nível é texto de interface e a duração é escrita no idioma de quem
   * lê. Sem o invólucro, o `render` escreveria a duração no idioma em que a
   * story abriu e ela ficaria para trás na troca.
   *
   * É AQUI que o horizonte é escrito, e nunca dentro da peça: este invólucro
   * está no papel de quem consome, que é quem conhece o idioma. Os controls
   * mexem em NÚMEROS de propósito — um control com o resto pronto ensinaria o
   * contrário do contrato, porque o resto sai da conta compartilhada.
   *
   * O horizonte é um interruptor, e não um campo de texto: o que a story precisa
   * mostrar é a LINHA que aparece e some, e a duração em si já chega escrita.
   */
  import { locale } from '@/lib/i18n';
  import { QuotaBanner } from './index';
  import {
    RENEWAL_MINUTES,
    quotaBannerLabelsFor,
    renewalInFor,
  } from './quota-banner.fixtures';

  const {
    used,
    limit,
    renews,
  }: {
    /** Quanto da cota já foi usado. A peça tira o resto da conta compartilhada. */
    used: number;
    /** O teto da cota. Sem ele não há resto, e a faixa não teria assunto. */
    limit: number;
    /** A cota renova? Quando não renova, a linha do horizonte não é montada. */
    renews: boolean;
  } = $props();

  const labels = $derived(quotaBannerLabelsFor($locale));
  // Os minutos saem do andaime, e não de um control: o que a story precisa
  // mostrar é a LINHA que aparece e some, e é a MESMA duração que a `play`
  // confere — dois números escritos em dois lugares divergiriam em silêncio.
  const horizon = $derived(renews ? renewalInFor($locale, RENEWAL_MINUTES) : undefined);
</script>

<QuotaBanner quota={{ used, limit }} renewsIn={horizon} {labels} />
