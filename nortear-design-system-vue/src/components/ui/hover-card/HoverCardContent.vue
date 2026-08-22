<script setup lang="ts">
import type { HoverCardContentProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { computed, inject, useAttrs } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import {
  HoverCardContent,
  HoverCardPortal,
  useForwardProps,
} from 'reka-ui'
import { cn } from '@/lib/utils'
import { KEY_HOVER_CARD } from './context'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<HoverCardContentProps & { class?: HTMLAttributes['class'] }>(),
  {
    align: 'center',
    sideOffset: 4,
  },
)

const delegatedProps = reactiveOmit(props, 'class')

const forwardedProps = useForwardProps(delegatedProps)

// `role="dialog"`: a reka não emite papel nenhum no conteúdo. O Vanilla —
// referência de markup — define, e é o que torna a prévia anunciável pelo
// leitor de tela. Sem `aria-modal`: a ausência já significa não-modal.
//
// O NOME acessível sai do rótulo que quem compõe declara e, sem ele, do texto
// do gatilho — a mesma regra das outras quatro stacks. O gatilho vem do
// CONTEXTO, não de uma busca no documento: com vários cartões na mesma tela (a
// story Sides), o primeiro `[data-slot="hover-card-trigger"]` daria o mesmo
// nome a todos os painéis.
const atributos = useAttrs()
const contexto = inject(KEY_HOVER_CARD, null)

const nomeAutomatico = computed(() => {
  if (atributos['aria-label'] || atributos['aria-labelledby']) return undefined
  return contexto?.gatilho.value?.textContent?.trim() || 'Prévia'
})
</script>

<template>
  <HoverCardPortal>
    <HoverCardContent
      data-slot="hover-card-content"
      role="dialog"
      :aria-label="nomeAutomatico"
      v-bind="{ ...$attrs, ...forwardedProps }"
      :class="cn( 'nds-hover-card-content', props.class, )"
    >
      <slot />
    </HoverCardContent>
  </HoverCardPortal>
</template>
