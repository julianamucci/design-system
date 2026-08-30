<script lang="ts">
  /**
   * Andaime das stories de composição do rascunho recuperado.
   *
   * A faixa e o campo são IRMÃOS num invólucro, e não pai e filho: é assim que
   * a peça se usa, e é o que prova que nada precisou ser acrescentado ao campo.
   * Num `*.stories.ts` não há onde escrever essa marcação, e todo export
   * nomeado dali vira story: daí este invólucro.
   *
   * Os rótulos são derivados do idioma, e não montados uma vez: a barra de
   * idioma do Storybook troca o idioma com a story montada, e o nome de cada
   * controle é texto de interface.
   */
  import { locale } from '@/lib/i18n';
  import { Composer } from './index';
  import { composerLabelsFor } from './composer.fixtures';
  import DraftRestore, { type DraftRestoreAction } from './draft-restore.svelte';
  import { SAMPLE_DRAFT, draftLabelsFor } from './draft-restore.fixtures';

  const {
    timestamp,
    onAction,
  }: {
    /** O carimbo já escrito. Ausente quando não se sabe de quando o rascunho é. */
    timestamp?: string;
    onAction?: (action: DraftRestoreAction) => void;
  } = $props();

  const labels = $derived(composerLabelsFor($locale));
  const draftLabels = $derived(draftLabelsFor($locale));
</script>

<!--
  Nenhum utilitário de pilha aqui, e é de propósito: a distância até o campo já
  é do desenho da faixa (`margin-block-end`), e uma pilha por cima somaria o gap
  dela ao respiro que a folha já declarou.
-->
<div class="nds-max-w-lg">
  <DraftRestore labels={draftLabels} draft={SAMPLE_DRAFT} {timestamp} {onAction} />
  <Composer {labels} />
</div>
