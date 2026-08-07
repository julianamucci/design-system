<script setup lang="ts">
import type { AccordionContentProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { AccordionContent } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<AccordionContentProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = reactiveOmit(props, 'class')
</script>

<template>
  <!--
    `role`/`aria-labelledby` anulados: com o painel sempre montado
    (unmount-on-hide=false, exigido pelo hidden="until-found"), o role="region"
    do reka deixa TODO item fechado como landmark. Medido na docs page — 41
    painéis viraram 41 landmarks e os de mesmo rótulo colidiram (axe
    landmark-unique). É a "proliferação de landmarks" que a APG manda evitar, e
    por isso ela trata o role no painel como opcional. A relação
    trigger -> conteúdo continua pelo `aria-controls`.
  -->
  <AccordionContent
    data-slot="accordion-content"
    v-bind="delegatedProps"
    class="nds-accordion-content"
    :role="undefined"
    :aria-labelledby="undefined"
  >
    <div
      :class="cn( 'nds-accordion-content-body', props.class, )"
    >
      <slot />
    </div>
  </AccordionContent>
</template>
