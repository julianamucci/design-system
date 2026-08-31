<script lang="ts">
  /**
   * Andaime da composição em que a execução que espera por uma pessoa fica FORA
   * da caixa recolhida.
   *
   * Quem separa é quem CONSOME, e a conta vem do vocabulário compartilhado: um
   * componente que filtrasse sozinho apagaria da tela um dado que recebeu. O
   * invólucro existe porque num `*.stories.ts` não há onde escrever o cartão e o
   * grupo empilhados, e todo export nomeado dali vira story.
   *
   * O cartão vem ANTES do grupo: sem a resposta, nada mais acontece.
   *
   * Os rótulos do GRUPO não entram por prop: são derivados do idioma, porque a
   * barra de idioma do Storybook os troca com a story montada.
   *
   * As CHAMADAS também não entram por prop, e saem do exemplo compartilhado: é
   * ele que a `play` confere do outro lado, então uma lista escrita à mão aqui
   * seria uma segunda verdade sobre a mesma tela.
   */
  import { locale } from '@/lib/i18n';
  import { Button } from '@/components/ui/button';
  import { ToolGroup } from '@/components/ui/tool-group';
  import { toolGroupLabelsFor } from '@/components/ui/tool-group/tool-group.fixtures';
  import { splitWaitingCalls } from '@shared/primitives/tool-group-summary';
  import {
    TOOL_CALL_WAITING,
    TOOL_CALLS_WITH_FAILURE,
  } from '@shared/primitives/tool-group-examples';
  import { ApprovalCard } from './index';
  import {
    approvalCardLabelsFor,
    approvalChoicesOf,
    approvalScopeOfWaiting,
  } from './approval-card.fixtures';

  const {
    onChoose,
  }: {
    onChoose?: (choice: string) => void;
  } = $props();

  const labels = $derived(approvalCardLabelsFor($locale));
  const groupLabels = $derived(toolGroupLabelsFor($locale));
  const choices = $derived(approvalChoicesOf(labels));

  /** Tudo o que aconteceu, na ordem — inclusive o que espera por alguém. */
  const split = splitWaitingCalls([TOOL_CALL_WAITING, ...TOOL_CALLS_WITH_FAILURE]);
</script>

<!-- Nenhum controle recebe ênfase — ver o andaime. -->
{#snippet choiceControls()}
  {#each choices as choice (choice.value)}
    <Button
      variant="outline"
      size="sm"
      data-approval-choice={choice.value}
    >{choice.label}</Button>
  {/each}
{/snippet}

<div class="nds-stack nds-max-w-lg" data-spacing="sm">
  <!--
    À vista, e antes do que já aconteceu: pedir autorização dentro de uma caixa
    fechada é pedir sem mostrar.
  -->
  {#each split.waiting as call (call.id)}
    <ApprovalCard
      question={labels.question.grant}
      scope={approvalScopeOfWaiting(labels, call)}
      actions={choiceControls}
      {onChoose}
    />
  {/each}

  <ToolGroup calls={split.grouped} labels={groupLabels} />
</div>
