<script lang="ts">
  /**
   * Andaime do quadro em retrato.
   *
   * Tela de telefone não é dezesseis por nove, e a peça não tem como saber. A
   * proporção é propriedade personalizada justamente para que quem consome a mude
   * NA FOLHA DELE, sem tirar o valor do tema e da escala de tipo.
   *
   * E "a folha dele", nesta stack, é um bloco de estilo escopado — não um
   * `style` inline. A distinção não é de gosto: a folha DECLARA
   * `--computer-use-aspect` no
   * próprio `.nds-computer-use`, e declaração no elemento vence valor herdado.
   * Pôr a propriedade num invólucro (ou no invólucro que o Svelte monta quando se
   * passa `--prop` a um componente) ficaria sem efeito nenhum, e a story
   * fotografaria dezesseis por nove achando que fotografa retrato — portão sem
   * dentes. Por isso a regra sai daqui com especificidade maior, escopada ao
   * invólucro para não vazar para o resto da página. É o mesmo caminho que o
   * snippet do painel Code ensina a quem consome.
   *
   * Num `*.stories.ts` não há onde escrever bloco de estilo nem `{#snippet}`: daí
   * este invólucro.
   */
  import {
    COMPUTER_STEPS_LOGIN,
  } from '@shared/primitives/computer-use-examples';
  import { locale } from '@/lib/i18n';
  import { ComputerUse } from './index';
  import ComputerUseDemoScreen from './ComputerUseDemoScreen.svelte';
  import { computerUseLabelsFor } from './computer-use.fixtures';

  const labels = $derived(computerUseLabelsFor($locale));
</script>

{#snippet screen()}
  <ComputerUseDemoScreen />
{/snippet}

<div class="nds-stack nds-max-w-2xs" data-spacing="lg" data-computer-use-portrait>
  <ComputerUse
    url="m.exemplo.com/entrar"
    {screen}
    steps={COMPUTER_STEPS_LOGIN}
    activeIndex={2}
    status="running"
    {labels}
  />
</div>

<style>
  /* A proporção do quadro, na folha de quem consome. */
  [data-computer-use-portrait] :global(.nds-computer-use) {
    --computer-use-aspect: 9 / 16;
  }
</style>
