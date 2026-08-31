<script lang="ts">
  /**
   * Andaime da faixa com um controle vindo de quem consome.
   *
   * É o teste de §7 da guideline 17: a peça desenha o LUGAR de quem responde, e
   * o que a resposta significa fica do lado de fora. Por isso o botão nasce
   * AQUI, no snippet `actions` que o invólucro passa para dentro da peça —
   * nesta stack é essa a forma de "o componente dá o lugar, e quem consome
   * decide", a mesma que a conversa e o cartão de autorização já fixaram. Num
   * `*.stories.ts` não há onde declarar um snippet, e todo export nomeado dali
   * vira story: daí este invólucro.
   *
   * O botão não tem manipulador nenhum, e isso é de propósito: demonstrar a
   * política seria demonstrar o que a peça não tem.
   *
   * A palavra do controle e o horizonte são derivados do idioma, porque a barra
   * de idioma do Storybook os troca com a story montada.
   */
  import { locale } from '@/lib/i18n';
  import { Button } from '@/components/ui/button';
  import { QuotaBanner, type QuotaBannerLabels } from './index';
  import {
    quotaBannerActionLabelFor,
    quotaOf,
    renewalOfFor,
  } from './quota-banner.fixtures';

  const {
    labels,
  }: {
    labels: QuotaBannerLabels;
  } = $props();

  const actionLabel = $derived(quotaBannerActionLabelFor($locale));
</script>

<QuotaBanner
  class="nds-max-w-lg"
  quota={quotaOf('warning')}
  renewsIn={renewalOfFor($locale, 'warning')}
  {labels}
>
  {#snippet actions()}
    <Button variant="outline" size="sm">{actionLabel}</Button>
  {/snippet}
</QuotaBanner>
