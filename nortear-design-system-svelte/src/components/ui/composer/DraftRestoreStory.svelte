<script lang="ts">
  /**
   * Andaime do Playground do rascunho recuperado.
   *
   * Os dois controles da story são props do componente, mas os RÓTULOS não
   * são: eles vêm da tradução, e nesta stack os args de uma story precisam
   * cobrir todos os props obrigatórios do componente que o `render` devolve.
   * Sem o invólucro, `labels` teria de virar arg — e um objeto de rótulos no
   * painel de controles é andaime exposto como se fosse API.
   *
   * Os rótulos são derivados do idioma, e não montados uma vez: a barra de
   * idioma do Storybook troca o idioma com a story montada, e o nome de cada
   * controle é texto de interface.
   */
  import { locale } from '@/lib/i18n';
  import DraftRestore, { type DraftRestoreAction } from './draft-restore.svelte';
  import { draftLabelsFor } from './draft-restore.fixtures';

  const {
    draft,
    timestamp,
    onAction,
  }: {
    /** O rascunho encontrado, inteiro. */
    draft: string;
    /** O carimbo já escrito. Vazio quando não se sabe de quando o rascunho é. */
    timestamp: string;
    onAction?: (action: DraftRestoreAction) => void;
  } = $props();

  const labels = $derived(draftLabelsFor($locale));
</script>

<!--
  Campo de texto vazio é ausência de carimbo, e não um carimbo em branco: uma
  string vazia desenharia o separador sem nada depois dele.
-->
<DraftRestore {labels} {draft} timestamp={timestamp || undefined} {onAction} />
