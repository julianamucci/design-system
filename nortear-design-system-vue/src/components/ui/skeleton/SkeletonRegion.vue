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
 * - `aria-busy="true"`, que é o estado, e que ao virar `false` é o que dispara o
 *   anúncio de "pronto";
 * - nome acessível, porque o leitor precisa saber O QUE carrega — e nome em
 *   elemento sem papel é atributo proibido, que o axe acusa
 *   (`aria-prohibited-attr`).
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
interface SkeletonRegionProps {
  /** Nome acessível: o que está carregando. */
  label: string
  class?: HTMLAttributes['class']
}

const props = defineProps<SkeletonRegionProps>()
</script>

<template>
  <div
    data-slot="skeleton-region"
    role="status"
    aria-busy="true"
    :aria-label="props.label"
    :class="props.class"
  >
    <slot />
  </div>
</template>
