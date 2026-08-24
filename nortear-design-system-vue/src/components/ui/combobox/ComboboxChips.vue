<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

/*
 * A caixa que CRESCE dentro do campo: chips e campo de texto moram aqui, e é
 * ela que quebra em linhas ou rola na horizontal, conforme o `data-chips` que
 * a raiz escreve no wrapper. Limpar e gatilho ficam FORA, irmãos dela, que é o
 * que os mantém sempre na primeira linha.
 *
 * Por isso o `<ComboboxInput>` é filho DESTA peça no modo múltiplo, e não do
 * wrapper: fora daqui, o texto pararia de fluir depois do último chip.
 */
const props = defineProps<{ class?: HTMLAttributes['class'] }>()
</script>

<template>
  <div
    data-slot="combobox-chips"
    :class="cn('nds-combobox-chips', props.class)"
  >
    <slot />
  </div>
</template>
