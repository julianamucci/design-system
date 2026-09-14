<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

// A caixa do esqueleto vem de `data-shape` / `data-width` (ver
// docs/shared/styles/nds/skeleton.css), nunca de altura cravada: altura é
// resultado de padding + tipografia, para o bloco crescer junto quando a
// pessoa aumenta a fonte do navegador (guideline 12, WCAG 1.4.4).
//
// `aria-hidden` sai marcado de fábrica e NÃO é sobrescrevível — o placeholder
// é ruído para leitor de tela, e quem anuncia o carregamento é a região que o
// contém. `inheritAttrs: false` com `$attrs` ANTES dos fixos: `data-shape`,
// `data-width`, `data-size` e `id` passam; um `aria-hidden` de passagem perde.
defineOptions({ inheritAttrs: false })

interface SkeletonProps {
  class?: HTMLAttributes['class']
}

const props = defineProps<SkeletonProps>()
</script>

<template>
  <div
    v-bind="$attrs"
    data-slot="skeleton"
    aria-hidden="true"
    :class="cn('nds-skeleton', props.class)"
  />
</template>
