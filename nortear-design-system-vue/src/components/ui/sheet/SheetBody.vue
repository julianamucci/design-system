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
const props = defineProps<{ class?: HTMLAttributes['class'] }>()
</script>

<template>
  <div
    data-slot="sheet-body"
    tabindex="0"
    :class="cn('nds-sheet-body', props.class)"
  >
    <slot />
  </div>
</template>
