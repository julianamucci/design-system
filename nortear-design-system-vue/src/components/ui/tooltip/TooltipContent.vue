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
  // 4 e não 0: o conteúdo compartilhado documenta 4, e a lib soma a altura da seta por conta própria.
  sideOffset: 4,
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

      <!-- `as-child`: sem ele a reka-ui passa a classe para o <svg> INTERNO da
           seta (o `inheritAttrs: false` do PopperArrow encaminha $attrs para o
           Arrow), e esse svg é `position: static` — a folha compartilhada
           pintava um quadrado girado por cima do triângulo que a lib já
           desenhava, 12px fora do centro do balão. Com `as-child` o elemento
           estilizado é este <div>, que é o mesmo que React e Svelte entregam:
           a lib posiciona, a folha desenha a forma. -->
      <TooltipArrow as-child>
        <div class="nds-tooltip-arrow"></div>
      </TooltipArrow>
    </TooltipContent>
  </TooltipPortal>
</template>
