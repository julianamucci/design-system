<script lang="ts">
  /**
   * Andaime da composição com a medição da janela.
   *
   * As duas peças são IRMÃS num invólucro, e não pai e filha: é assim que elas
   * se usam, e é o que prova que nenhuma precisou saber da outra. Num
   * `*.stories.ts` não há onde escrever essa marcação, e todo export nomeado
   * dali vira story: daí este invólucro.
   *
   * As props são as MESMAS da peça — o arquivo de stories é tipado pelo
   * componente, e um invólucro com vocabulário próprio deixaria de caber ali. Os
   * rótulos da MEDIÇÃO não entram por prop: são derivados do idioma, porque a
   * barra de idioma do Storybook os troca com a story montada.
   */
  import { locale } from '@/lib/i18n';
  import { ContextDisplay } from '@/components/ui/context-display';
  import {
    contextDisplayLabelsFor,
    usageOf,
  } from '@/components/ui/context-display/context-display.fixtures';
  import type { ContextPart } from '@shared/primitives/token-budget';
  import { ContextBreakdown, type ContextBreakdownLabels } from './index';

  const {
    parts,
    labels,
  }: {
    /** A repartição desenhada abaixo da medição. */
    parts: readonly ContextPart[];
    labels: ContextBreakdownLabels;
  } = $props();

  const budgetLabels = $derived(contextDisplayLabelsFor($locale));
</script>

<div class="nds-stack nds-max-w-lg" data-spacing="md">
  <ContextDisplay usage={usageOf('warning')} labels={budgetLabels} />
  <ContextBreakdown {parts} {labels} />
</div>
