<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { CheckIcon } from 'lucide-vue-next'
import { ComboboxItemIndicator } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<{ class?: HTMLAttributes['class'] }>()

/*
 * O invólucro está sempre no DOM e a marca só aparece na opção escolhida: é ele
 * que reserva a largura, para a linha não pular de tamanho a cada escolha.
 */
</script>

<template>
  <span
    data-slot="combobox-item-indicator"
    :class="cn('nds-combobox-item-indicator', props.class)"
  >
    <ComboboxItemIndicator>
      <slot>
        <CheckIcon />
      </slot>
    </ComboboxItemIndicator>
  </span>
</template>
