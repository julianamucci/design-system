<script lang="ts">
  /**
   * O lugar da resposta: a pergunta feita, e embaixo dela o que vier a seguir.
   *
   * Existe porque o que se demonstra aqui não é o indicador sozinho — mostrado
   * assim ele é só um desenho de três pontos —, e sim o LUGAR que ele ocupa.
   * Nesta stack o `render` de uma story devolve UM componente, e o lugar é uma
   * composição: sem este invólucro, o andaime da demonstração vazaria para a
   * API da peça só para o tipo fechar.
   *
   * A frase é derivada do idioma, e não montada uma vez: a barra de idioma do
   * Storybook troca o idioma com a story montada, e a frase é texto de
   * interface.
   */
  import { locale } from '@/lib/i18n';
  import { Markdown } from '@/components/ui/markdown';
  import { ThinkingIndicator } from './index';
  import { answerText, indicatorLabelsFor, questionText } from './thinking-indicator.fixtures';

  const { arrived = false }: {
    /** O texto já chegou? Com ele, o indicador não existe mais no documento. */
    arrived?: boolean;
  } = $props();

  const labels = $derived(indicatorLabelsFor($locale));
</script>

<!--
  A pergunta entra por Markdown, e não por marcação escrita à mão: o lugar só
  existe se houver uma conversa acima dele.
-->
<div class="nds-stack nds-max-w-lg" data-spacing="md">
  <Markdown content={questionText()} />
  {#if arrived}
    <Markdown content={answerText()} />
  {:else}
    <ThinkingIndicator label={labels.generating} />
  {/if}
</div>
