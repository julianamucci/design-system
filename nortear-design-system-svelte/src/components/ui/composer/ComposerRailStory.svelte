<script lang="ts">
  /**
   * Andaime da story do trilho.
   *
   * O trilho é um ESPAÇO, e nesta stack esse espaço é um `{#snippet}` — que só
   * existe dentro de marcação. Num `*.stories.ts` não há onde declará-lo, e todo
   * export nomeado dali vira story: daí este invólucro.
   */
  import { Button } from '@/components/ui/button';
  import { locale } from '@/lib/i18n';
  import { Composer } from './index';
  import { attachLabelFor, composerLabelsFor } from './composer.fixtures';

  const {
    value,
    onAttach,
  }: {
    value: string;
    onAttach: () => void;
  } = $props();

  const labels = $derived(composerLabelsFor($locale));
  const attach = $derived(attachLabelFor($locale));
</script>

<!--
  O snippet vem ANTES de quem o usa: a marcação abaixo o passa como o trilho, e
  declará-lo depois deixaria a referência apontando para o nada.
-->
{#snippet railStart()}
  <Button variant="ghost" size="sm" onclick={onAttach}>{attach}</Button>
{/snippet}

<Composer {labels} {value} {railStart} class="nds-max-w-lg" />
