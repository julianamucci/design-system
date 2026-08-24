<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'
import { useComboboxContext } from './index'

const props = defineProps<{ class?: HTMLAttributes['class'] }>()

/*
 * `<label for>` de verdade, e não um `aria-label`: o papel de combobox não
 * aceita nome vindo do próprio conteúdo, e um rótulo visível continua sendo o
 * único que serve para quem enxerga e para quem não enxerga ao mesmo tempo.
 */
const { inputId } = useComboboxContext()
</script>

<template>
  <label
    :for="inputId"
    data-slot="combobox-label"
    :class="cn('nds-combobox-label', props.class)"
  >
    <slot />
  </label>
</template>
