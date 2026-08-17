<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { computed } from 'vue'
import { cn } from '@/lib/utils'

// ─── AspectRatio ──────────────────────────────────────────────────────────────
//
// SEM o primitivo do reka-ui, pela mesma razão que o Angular dispensa o
// `RdxAspectRatioDirective`: ele resolve o problema por outro mecanismo. O
// reka-ui envolve o conteúdo num wrapper extra com
// `padding-bottom: <porcentagem>` — o truque anterior ao `aspect-ratio` nativo —
// e não emite classe nenhuma. O resultado era um componente que produzia a caixa
// certa e ficava FORA da folha compartilhada: `.nds-aspect-ratio` não existia no
// DOM, `--ratio` não existia, e a regra `.nds-aspect-ratio > *` (que estica o
// filho para cobrir a caixa) não se aplicava. Medido: um filho sem altura
// própria ficava 126px mais curto que o container, enquanto nas outras stacks
// preenchia.
//
// Aqui o elemento é nativo e alimenta a custom property que
// `docs/shared/styles/nds/aspect-ratio.css` lê. A prop pública (`ratio`) não
// muda.

const props = withDefaults(defineProps<{
  /** Proporção largura/altura. Ex.: `16/9`, `4/3`, `1`. Default `1` (quadrado). */
  ratio?: number
  class?: HTMLAttributes['class']
}>(), {
  ratio: 1,
})

// String e não número: custom property recebe valor literal, e deixar o
// framework decidir a serialização é como um `px` indevido aparece.
const estilo = computed(() => ({ '--ratio': String(props.ratio) }))
</script>

<template>
  <div
    data-slot="aspect-ratio"
    :class="cn('nds-aspect-ratio', props.class)"
    :style="estilo"
  >
    <slot />
  </div>
</template>
