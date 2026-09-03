<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

/**
 * Corpo rolável do painel.
 *
 * `tabindex="0"`, como no Vanilla: quando o conteúdo passa da altura do painel,
 * a região rolável precisa ser alcançável por teclado (WCAG 2.1.1 — é a regra
 * `scrollable-region-focusable` do axe). O `flex` do CSS compartilhado é o que
 * mantém o rodapé no lugar enquanto o corpo rola.
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
  /**
   * Declarado em camelCase de propósito. O Vue CAMELIZA o nome de toda prop
   * declarada, então uma prop escrita `'aria-label'` passa a viver em
   * `props.ariaLabel` — e `props['aria-label']` devolve `undefined` para
   * sempre. Era o que acontecia aqui: o atributo chegava, era CONSUMIDO como
   * prop (e por isso nem caía como atributo de fallthrough), e as duas
   * ligações abaixo liam `undefined`. Resultado medido: o corpo rolável ficava
   * sem `role` E sem nome, exatamente a falha que este bloco existe para
   * evitar. Quem compõe continua escrevendo `aria-label="..."` no template —
   * o Vue casa o atributo com esta prop, e o markup no DOM não muda.
   */
  ariaLabel?: string
}>()
</script>

<template>
  <div
    data-slot="sheet-body"
    tabindex="0"
    :role="props.ariaLabel ? 'group' : undefined"
    :aria-label="props.ariaLabel"
    :class="cn('nds-sheet-body', props.class)"
  >
    <slot />
  </div>
</template>
