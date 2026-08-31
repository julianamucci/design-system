<script lang="ts">
  /**
   * Andaime da composição com o bloco que expande.
   *
   * Recolher é COMPOSIÇÃO, e não recurso da peça, então o controle mora aqui, no
   * hospedeiro. Num `*.stories.ts` não há onde escrever essa marcação, e todo
   * export nomeado dali vira story: daí este invólucro.
   *
   * DIVERGÊNCIA DE API a registrar, e ela é do bloco de expansão, não da
   * repartição: nesta stack o recolhimento é uma composição de três componentes
   * — raiz, gatilho e conteúdo —, e a abertura inicial se declara por estado
   * ligado à raiz, e não por um argumento de configuração. Divergência de API de
   * framework não se "alinha": registra-se. O que não muda é o que importa — o
   * controle continua sendo um botão de verdade, por fora da repartição, e a
   * repartição continua sem saber que está sendo recolhida.
   *
   * As props são as MESMAS da peça — o arquivo de stories é tipado pelo
   * componente, e um invólucro com vocabulário próprio deixaria de caber ali.
   */
  import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
  import type { ContextPart } from '@shared/primitives/token-budget';
  import { ContextBreakdown, type ContextBreakdownLabels } from './index';

  const {
    parts,
    labels,
  }: {
    /** A repartição que o bloco recolhe. */
    parts: readonly ContextPart[];
    labels: ContextBreakdownLabels;
  } = $props();

  // Aberto de saída: o assunto da story é onde a repartição mora, e não a
  // animação de abrir. Fechada, a foto não mostraria nada do que se quer provar.
  let open = $state(true);
</script>

<Collapsible bind:open class="nds-max-w-lg">
  <!-- O gatilho recebe as classes do botão em vez de embrulhar um componente: é
       o idioma desta stack para o disclosure, e é o que mantém o elemento
       renderizado sendo um <button> de verdade, com `aria-expanded` e
       `aria-controls` vindos da própria composição. -->
  <CollapsibleTrigger class="nds-button nds-button-outline nds-button-sm">
    {labels.title}
  </CollapsibleTrigger>
  <CollapsibleContent>
    <ContextBreakdown {parts} {labels} />
  </CollapsibleContent>
</Collapsible>
