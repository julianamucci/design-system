<script lang="ts">
  /**
   * A troca, que é a única regra da peça que ela não cumpre sozinha.
   *
   * O controle é o andaime da demonstração, e ocupa aqui o lugar que na vida
   * real é do primeiro trecho de texto chegando pelo protocolo. A troca é a
   * mesma: quem monta a conversa tira o indicador e põe a resposta.
   */
  import { locale } from '@/lib/i18n';
  import { Button } from '@/components/ui/button';
  import { Markdown } from '@/components/ui/markdown';
  import { ThinkingIndicator } from './index';
  import { answerText, indicatorLabelsFor, questionText } from './thinking-indicator.fixtures';

  const labels = $derived(indicatorLabelsFor($locale));

  let arrived = $state(false);
</script>

<div class="nds-stack nds-max-w-lg" data-spacing="md">
  <div class="nds-stack" data-spacing="sm">
    <Markdown content={questionText()} />
    {#if arrived}
      <Markdown content={answerText()} />
    {:else}
      <ThinkingIndicator label={labels.generating} />
    {/if}
  </div>

  <Button
    data-slot="thinking-indicator-reveal"
    variant="secondary"
    size="sm"
    onclick={() => (arrived = true)}
  >
    {labels.reveal}
  </Button>
</div>
