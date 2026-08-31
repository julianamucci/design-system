<script lang="ts">
  /**
   * Andaime do Playground do cartão de autorização.
   *
   * Os rótulos são derivados do idioma, e não montados uma vez: a barra de
   * idioma do Storybook troca o idioma com a story montada, e o termo de cada
   * linha do alcance é texto de interface. Sem o invólucro, o `render` montaria
   * os rótulos no idioma em que a story abriu e eles ficariam para trás na
   * troca.
   *
   * O invólucro também é onde os CONTROLES nascem, e é de propósito: eles são
   * de quem consome (§7 da guideline 17), e num `*.stories.ts` não há onde
   * escrever um bloco de marcação — todo export nomeado dali vira story.
   */
  import { locale } from '@/lib/i18n';
  import { Button } from '@/components/ui/button';
  import { ApprovalCard } from './index';
  import {
    approvalCardLabelsFor,
    approvalChoicesOf,
    approvalScopeOf,
    type ApprovalExampleName,
  } from './approval-card.fixtures';

  const {
    question,
    scope,
    onChoose,
  }: {
    /** A pergunta que o cartão faz. Quem a escreve é quem consome. */
    question: string;
    /** Qual exemplo de alcance desenhar — ou nenhum. */
    scope: ApprovalExampleName | 'none';
    onChoose?: (choice: string) => void;
  } = $props();

  const labels = $derived(approvalCardLabelsFor($locale));
  const choices = $derived(approvalChoicesOf(labels));

  /**
   * "Sem alcance" é AUSÊNCIA de lista, e não uma lista vazia: um arranjo sem
   * itens desenharia uma caixa com afastamento e nada dentro.
   */
  const cardScope = $derived(scope === 'none' ? undefined : approvalScopeOf(labels, scope));
</script>

<!--
  Nenhum controle recebe ênfase, e isso é decisão de produto: num cartão que
  pede autorização, destacar "permitir" empurra para aprovar. Ver o andaime.
-->
{#snippet choiceControls()}
  {#each choices as choice (choice.value)}
    <Button
      variant="outline"
      size="sm"
      data-approval-choice={choice.value}
    >{choice.label}</Button>
  {/each}
{/snippet}

<ApprovalCard
  {question}
  scope={cardScope}
  actions={choiceControls}
  {onChoose}
  class="nds-max-w-md"
/>
