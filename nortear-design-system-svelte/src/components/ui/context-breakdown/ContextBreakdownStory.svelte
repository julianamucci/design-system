<script lang="ts">
  /**
   * Andaime do Playground da repartição do contexto.
   *
   * Os rótulos são derivados do idioma, e não montados uma vez: a barra de
   * idioma do Storybook troca o idioma com a story montada, e a palavra de cada
   * origem é texto de interface. Sem o invólucro, o `render` montaria os rótulos
   * no idioma em que a story abriu e eles ficariam para trás na troca.
   *
   * O invólucro também é onde os quatro controls viram uma REPARTIÇÃO: a ordem
   * das parcelas sai de `CONTEXT_PART_IDS`, e não de quatro linhas escritas
   * aqui, porque é ela que decide a cor de cada fatia e a linha de cada legenda.
   */
  import { locale } from '@/lib/i18n';
  import { CONTEXT_PART_IDS } from '@shared/primitives/context-breakdown-examples';
  import { ContextBreakdown } from './index';
  import { contextBreakdownLabelsFor } from './context-breakdown.fixtures';

  const {
    system,
    history,
    attachments,
    tools,
  }: {
    /** Quanto as instruções do sistema trouxeram. */
    system: number;
    /** Quanto o histórico da conversa trouxe. */
    history: number;
    /** Quanto os anexos trouxeram. */
    attachments: number;
    /** Quanto os resultados de ferramenta trouxeram. */
    tools: number;
  } = $props();

  const labels = $derived(contextBreakdownLabelsFor($locale));

  const byOrigin = $derived({ system, history, attachments, tools });

  /** As parcelas dos controls, na ordem canônica das origens compartilhadas. */
  const parts = $derived(CONTEXT_PART_IDS.map((id) => ({ id, tokens: byOrigin[id] })));
</script>

<ContextBreakdown {parts} {labels} />
