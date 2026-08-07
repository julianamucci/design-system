<script lang="ts" setup>
import type { HTMLAttributes } from 'vue'

import { MoreHorizontalIcon } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
  /**
   * Nome acessível do indicador de níveis ocultos. Com rótulo, as reticências
   * são anunciadas; sem ele, ficam decorativas — que é o certo quando um
   * gatilho as envolve e já carrega o próprio nome.
   */
  label?: string
}>()
</script>

<template>
  <!-- O texto sr-only morava DENTRO de um aria-hidden: nenhum leitor de tela chegava
   nele, então o rótulo não existia na prática — e ainda estava em inglês num
   produto em português. As reticências são decorativas mesmo; quem nomeia o
   conjunto oculto é o gatilho que as envolve, como na composição com menu. -->
  <span
    data-slot="breadcrumb-ellipsis"
    :role="label ? 'img' : undefined"
    :aria-label="label || undefined"
    :aria-hidden="label ? undefined : 'true'"
    :class="cn('nds-breadcrumb-ellipsis', props.class)"
  >
    <slot>
      <MoreHorizontalIcon />
    </slot>
  </span>
</template>
