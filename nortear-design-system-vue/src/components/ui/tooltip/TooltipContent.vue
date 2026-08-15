<script setup lang="ts">
import type { TooltipContentEmits, TooltipContentProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { TooltipArrow, TooltipContent, TooltipPortal, useForwardPropsEmits } from 'reka-ui'
import { cn } from '@/lib/utils'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<TooltipContentProps & { class?: HTMLAttributes['class'] }>(), {
  sideOffset: 0,
})

const emits = defineEmits<TooltipContentEmits>()

const delegatedProps = reactiveOmit(props, 'class')
const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <TooltipPortal>
    <!-- role="tooltip": o reka-ui põe o papel num <span> de VisuallyHidden
         DENTRO do balão, e esse span nasce com `aria-hidden="true"` (o
         `feature: 'focusable'` padrão do VisuallyHidden). O papel fica, na
         prática, fora da árvore de acessibilidade: o balão VISÍVEL é um <div>
         sem papel. Declarar aqui devolve o contrato que Vanilla — referência
         cross-stack —, Svelte e Angular já cumprem. O span da lib continua
         existindo: é ele que o `aria-describedby` do gatilho referencia, e por
         isso o texto do balão aparece duplicado em `textContent`. -->
    <TooltipContent
      data-slot="tooltip-content"
      role="tooltip"
      v-bind="{ ...forwarded, ...$attrs }"
      :class="cn('nds-tooltip-content', props.class)"
    >
      <slot />

      <TooltipArrow class="nds-tooltip-arrow" />
    </TooltipContent>
  </TooltipPortal>
</template>
