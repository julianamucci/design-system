<script lang="ts" setup>
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

/**
 * Corpo rolável do painel.
 *
 * `tabindex="0"` é obrigatório, não decoração: região que rola precisa ser
 * alcançável por teclado (WCAG 2.1.1 — regra `scrollable-region-focusable` do
 * axe). `role` e nome acessível ficam com quem compõe, porque só ali se sabe o
 * que a região contém.
 *
 * `.nds-drawer-body` traz `flex: 1 1 auto`, `min-height: 0` e `overflow: auto`.
 * A base `auto` é o que faz o corpo contribuir com a altura do conteúdo para o
 * painel — com a base zero do atalho `flex: 1` o teto de altura nunca aperta
 * ninguém, e o conteúdo transborda em vez de rolar. O `min-height: 0` é o que
 * o deixa ceder altura dentro do flex em coluna, em vez de esticar o painel e
 * empurrar o rodapé (com as ações) para fora da tela.
 */
const props = defineProps<{
  class?: HTMLAttributes['class']
  /**
   * O nome vem de quem compõe, por `aria-label`, e NÃO tem padrão.
   *
   * O conteúdo do painel é o que quem monta pôs lá dentro, e só ali se sabe o que
   * é. Padrão genérico ("Conteúdo") anunciaria sem informar. Também não herdamos o
   * título do painel: em quatro das cinco stacks o id dele é gerado pela lib por
   * dentro e não alcança este subcomponente sem inventar um contexto — e o título já
   * foi anunciado na abertura, então repeti-lo aqui informaria pouco pelo que custa.
   *
   * O que MUDOU é que o nome agora chega. Antes, um `aria-label` escrito aqui caía
   * num `div` sem papel e era DESCARTADO pelo leitor de tela — atributo proibido,
   * que o axe acusa como `aria-prohibited-attr`. Quem tentava nomear a região não
   * tinha como saber que não funcionou. Agora o papel vem junto com o nome.
   *
   * `group` e não `region`: o corpo já vive dentro de um diálogo nomeado, e um
   * marco aninhado num diálogo não acrescenta navegação — acrescenta entrada na
   * lista.
   */
  /* eslint-disable-next-line vue/prop-name-casing --
     O nome é atributo de ARIA e não pode virar camelCase: `ariaLabel` não
     nomeia nada no DOM. Mantém o markup idêntico ao das outras quatro stacks,
     que é o contrato que este design system guarda. */
  'aria-label'?: string
}>()
</script>

<template>
  <div
    data-slot="drawer-body"
    tabindex="0"
    :role="props['aria-label'] ? 'group' : undefined"
    :aria-label="props['aria-label']"
    :class="cn('nds-drawer-body', props.class)"
  >
    <slot />
  </div>
</template>
