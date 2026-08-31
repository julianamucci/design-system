<script lang="ts">
  /**
   * Andaime das FORMAS que o cartão toma conforme o que recebe.
   *
   * Um invólucro só para as cinco formas, e não um por story: o que muda entre
   * elas é qual argumento chega — o alcance, o comprimento do valor, quantas
   * escolhas, e se há controle nenhum. Cinco cópias divergiriam na largura sem
   * nenhum sinal, e a largura é justamente o que faz o caminho comprido quebrar.
   *
   * A largura é apertada de propósito: é ela que faz o valor comprido quebrar, e
   * a quebra é o assunto de uma das formas.
   *
   * O ESPAÇO DA RESPOSTA é passado por prop, e não declarado dentro da tag: é
   * assim que "sem controle nenhum" vira ausência, e não um bloco vazio. Bloco
   * vazio desenharia a caixa, que é exatamente o que a forma nega.
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
    name,
    withScope = true,
    withActions = true,
    onChoose,
  }: {
    /** Qual exemplo desenhar: publicar, gastar ou tocar um arquivo. */
    name: ApprovalExampleName;
    /** Desenha a lista do alcance. Sem ela, a pergunta já diz tudo. */
    withScope?: boolean;
    /** Passa os controles. Sem eles, a caixa da resposta não existe. */
    withActions?: boolean;
    onChoose?: (choice: string) => void;
  } = $props();

  const labels = $derived(approvalCardLabelsFor($locale));
  const choices = $derived(approvalChoicesOf(labels));
  const cardScope = $derived(withScope ? approvalScopeOf(labels, name) : undefined);
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

<ApprovalCard
  question={labels.question[name]}
  scope={cardScope}
  actions={withActions ? choiceControls : undefined}
  {onChoose}
  class="nds-max-w-sm"
/>
