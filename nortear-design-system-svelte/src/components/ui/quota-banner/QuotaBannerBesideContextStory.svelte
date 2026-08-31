<script lang="ts">
  /**
   * Andaime da composição com a medição da janela.
   *
   * As duas são IRMÃS num invólucro, e não pai e filha: cada uma responde a uma
   * pergunta sobre a MESMA conversa — quanto da janela já foi ocupado, e quanto
   * da cota ainda sobra —, e aninhá-las faria a segunda parecer detalhe da
   * primeira. Num `*.stories.ts` não há onde escrever essa marcação, e todo
   * export nomeado dali vira story: daí este invólucro.
   *
   * A medição da janela entra por PROP, e não fica cravada aqui: é ela que a
   * story compara com a fração da cota, e um segundo lugar guardando o mesmo
   * número faria a comparação provar a cópia em vez do pareamento.
   *
   * Os rótulos da JANELA não entram por prop: são derivados do idioma, porque a
   * barra de idioma do Storybook os troca com a story montada.
   */
  import { locale } from '@/lib/i18n';
  import { ContextDisplay } from '@/components/ui/context-display';
  import { contextDisplayLabelsFor } from '@/components/ui/context-display/context-display.fixtures';
  import type { TokenUsage } from '@shared/primitives/chat-protocol';
  import { QuotaBanner, type QuotaBannerLabels } from './index';
  import { quotaOf, renewalOfFor } from './quota-banner.fixtures';

  const {
    usage,
    labels,
  }: {
    /** A janela, ocupada na mesma fração do exemplo de aviso da cota. */
    usage: TokenUsage;
    labels: QuotaBannerLabels;
  } = $props();

  const windowLabels = $derived(contextDisplayLabelsFor($locale));
</script>

<div class="nds-stack nds-max-w-lg" data-spacing="md">
  <ContextDisplay {usage} form="bar" labels={windowLabels} />
  <QuotaBanner
    quota={quotaOf('warning')}
    renewsIn={renewalOfFor($locale, 'warning')}
    {labels}
  />
</div>
