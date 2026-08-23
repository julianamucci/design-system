<script setup lang="ts">
import type { AccordionContentProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { inject, onMounted, ref } from 'vue'
import { reactiveOmit, unrefElement } from '@vueuse/core'
import { AccordionContent } from 'reka-ui'
import { cn } from '@/lib/utils'
import { ACCORDION_ITEM_IDS } from './accordion-a11y'

const props = defineProps<AccordionContentProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = reactiveOmit(props, 'class')

// Ver accordion-a11y.ts: o id nasce dentro do reka e só pode ser LIDO daqui —
// tentar impô-lo pelo atributo perde para o mergeProps da lib, e o
// aria-controls acabaria apontando para um elemento que não existe.
const panel = ref<InstanceType<typeof AccordionContent> | null>(null)
const contentId = inject(ACCORDION_ITEM_IDS, ref(''))
onMounted(() => {
  const el = unrefElement(panel as never) as HTMLElement | undefined
  /* v8 ignore next -- o painel fica sempre montado (unmount-on-hide=false),
     então o elemento existe em toda story; a guarda é de tipo. */
  if (el?.id) contentId.value = el.id
})
</script>

<template>
  <!--
    `role`/`aria-labelledby` anulados: com o painel sempre montado
    (unmount-on-hide=false, exigido pelo hidden="until-found"), o role="region"
    do reka deixa TODO item fechado como landmark. Medido na docs page — 41
    painéis viraram 41 landmarks e os de mesmo rótulo colidiram (axe
    landmark-unique). É a "proliferação de landmarks" que a APG manda evitar, e
    por isso ela trata o role no painel como opcional.

    O `aria-controls` do gatilho é fiado por accordion-a11y.ts: o reka o monta a
    partir de um contexto não reativo que ainda está vazio quando o gatilho
    renderiza, e nunca mais o atualiza. A ponte publica daqui o id REAL do
    painel — ler em vez de impor, porque o mergeProps da lib vence um id nosso e
    o atributo passaria a apontar para elemento inexistente.
  -->
  <AccordionContent
    ref="panel"
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
