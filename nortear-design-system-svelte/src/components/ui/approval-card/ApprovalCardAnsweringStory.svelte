<script lang="ts">
  /**
   * Andaime da composição que prova a fronteira nos DOIS sentidos.
   *
   * Um controle traz o atributo e conta como resposta; o outro não traz e por
   * isso não dispara nada — inventar uma escolha que ninguém marcou seria
   * decidir por quem consome. Num `*.stories.ts` não há onde escrever os dois
   * controles, e todo export nomeado dali vira story: daí este invólucro.
   *
   * Os rótulos são derivados do idioma, porque a barra de idioma do Storybook os
   * troca com a story montada.
   */
  import { locale } from '@/lib/i18n';
  import { Button } from '@/components/ui/button';
  import { APPROVAL_CHOICE_ALLOW_ONCE } from '@shared/primitives/approval-card-examples';
  import { ApprovalCard } from './index';
  import {
    approvalCardLabelsFor,
    approvalChoicesOf,
    approvalScopeOf,
  } from './approval-card.fixtures';

  const {
    onChoose,
  }: {
    onChoose?: (choice: string) => void;
  } = $props();

  const labels = $derived(approvalCardLabelsFor($locale));
  const choices = $derived(approvalChoicesOf(labels, [APPROVAL_CHOICE_ALLOW_ONCE]));
  const cardScope = $derived(approvalScopeOf(labels, 'publish'));
</script>

{#snippet choiceControls()}
  <!-- Só o controle que traz o atributo conta como resposta. -->
  {#each choices as choice (choice.value)}
    <Button
      variant="outline"
      size="sm"
      data-approval-choice={choice.value}
    >{choice.label}</Button>
  {/each}

  <!--
    Este não traz, e por isso não dispara nada: um link de "saiba mais" no meio
    dos controles continua sendo só um link.
  -->
  <Button variant="ghost" size="sm">{labels.learnMore}</Button>
{/snippet}

<ApprovalCard
  question={labels.question.publish}
  scope={cardScope}
  actions={choiceControls}
  {onChoose}
  class="nds-max-w-md"
/>
