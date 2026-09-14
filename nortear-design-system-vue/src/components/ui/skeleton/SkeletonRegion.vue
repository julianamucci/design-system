<script setup lang="ts">
import type { HTMLAttributes } from 'vue'

/**
 * A região que ESPERA o conteúdo.
 *
 * O esqueleto é decoração e sai `aria-hidden` de fábrica — quem anuncia o
 * carregamento é o contêiner em volta dele, e o anúncio depende do TRIO inteiro:
 *
 * - `role="status"`, porque `aria-busy` sozinho num `div` sem papel não é
 *   anunciado;
 * - `aria-busy="true"`, que é o estado — FIXO: a região não alterna para
 *   `false`. Quando o conteúdo chega, ela SAI inteira e o conteúdo real entra
 *   no lugar (decisão da dona, 2026-09-14). Região vazia deixada para trás
 *   continuaria dizendo que algo carrega;
 * - nome acessível, porque o leitor precisa saber O QUE carrega — e nome em
 *   elemento sem papel é atributo proibido, que o axe acusa
 *   (`aria-prohibited-attr`).
 *
 * Papel e estado NÃO são sobrescrevíveis. `inheritAttrs: false` com o
 * `v-bind="$attrs"` ANTES dos atributos fixos: no Vue 3 quem vem depois na
 * ordem do template vence, então um `role` ou `aria-busy` de passagem é
 * descartado em vez de cair por cima. Atributos de layout (`data-spacing`,
 * `data-align`, `id`) continuam passando.
 *
 * Era peça de ninguém: as cinco docs pages montavam este contêiner à mão e
 * divergiram em cinco formas — uma delas sem `role="status"`. Virou peça em
 * 2026-09-13, por decisão da dona, com o mesmo contrato nas cinco stacks.
 *
 * Uma região por BLOCO, nunca por peça: cinco itens de três esqueletos seriam
 * quinze avisos repetindo a mesma frase.
 *
 * Não tem CSS próprio. O layout do bloco chega por `class` e é repassado como
 * veio, para que a região possa ser qualquer coisa — cartão, pilha, grade.
 */
defineOptions({ inheritAttrs: false })

interface SkeletonRegionProps {
  /** Nome acessível: o que está carregando. */
  label: string
  class?: HTMLAttributes['class']
}

const props = defineProps<SkeletonRegionProps>()
</script>

<template>
  <div
    v-bind="$attrs"
    data-slot="skeleton-region"
    role="status"
    aria-busy="true"
    :aria-label="props.label"
    :class="props.class"
  >
    <slot />
  </div>
</template>
