<script lang="ts">
  /**
   * Andaime das stories do seletor de modelo.
   *
   * Existe por dois motivos, e os dois são desta stack:
   *
   * 1. O TRILHO É UM `{#snippet}`, e snippet só existe dentro de marcação. Num
   *    `*.stories.ts` não há onde declará-lo, e todo export nomeado dali vira
   *    story. Mesma decisão do andaime do trilho, ao lado.
   * 2. `value` e `open` SÃO SEMENTE: o seletor é dono do estado depois de
   *    montado, e mexer no controle do Playground trocaria a prop de uma peça
   *    já montada, que por contrato não reabre nada. O `{#key}` remonta, que é
   *    o que faz o controle valer o que ele promete — trocar a semente e ver a
   *    peça nascer com ela.
   *
   * O ALVO DE FORA existe só para a `play` ter onde acionar, e por isso é texto
   * inerte: um botão de verdade acrescentaria um controle sem assunto à foto e
   * ao percurso do teclado.
   */
  import { locale } from '@/lib/i18n';
  import type { ModelOption } from '@shared/primitives/chat-protocol';
  import { Composer, ComposerModelPicker } from './index';
  import { composerLabelsFor } from './composer.fixtures';
  import { everyModel, modelLabelsFor } from './composer-model-picker.fixtures';

  const {
    // A lista completa é o padrão porque o Playground não tem controle para
    // ela: lá os eixos são o escolhido e a abertura, e uma prop obrigatória de
    // andaime obrigaria a story a declarar um arg sem controle que o mostre.
    models = everyModel(),
    value,
    open = false,
    rail = false,
    outside = false,
    onValueChange,
  }: {
    /** Os modelos que podem responder, na ordem em que aparecem na lista. */
    models?: ModelOption[];
    /** O modelo escolhido, pelo endereço dele. */
    value?: string;
    /** A lista começa aberta. */
    open?: boolean;
    /** Monta o seletor no início do trilho de um campo. */
    rail?: boolean;
    /** Põe um alvo inerte fora do seletor, para o gesto de fechar. */
    outside?: boolean;
    onValueChange?: (model: ModelOption) => void;
  } = $props();

  const labels = $derived(composerLabelsFor($locale));
  const pickerLabels = $derived(modelLabelsFor($locale));

  /** As duas sementes juntas: mudou qualquer uma, a peça nasce de novo. */
  const seed = $derived(`${value ?? ''}|${open}`);
</script>

<!--
  Os snippets vêm ANTES de quem os usa: a marcação abaixo os renderiza, e
  declará-los depois deixaria a referência apontando para o nada.
-->
{#snippet picker()}
  {#key seed}
    <ComposerModelPicker labels={pickerLabels} {models} {value} {open} {onValueChange} />
  {/key}
{/snippet}

{#snippet railStart()}
  {@render picker()}
{/snippet}

{#if rail}
  <Composer {labels} {railStart} class="nds-max-w-lg" />
{:else if outside}
  <div class="nds-stack" data-spacing="md">
    {@render picker()}
    <p
      class="nds-text-caption nds-text-muted-foreground"
      data-slot="outside-target">Fora do seletor</p>
  </div>
{:else}
  {@render picker()}
{/if}
