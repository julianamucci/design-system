<script setup lang="ts">
import type { AlertDialogContentEmits, AlertDialogContentProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { computed, useAttrs } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import {
  AlertDialogContent,
  AlertDialogOverlay,
  AlertDialogPortal,
  useForwardPropsEmits,
} from 'reka-ui'
import { cn } from '@/lib/utils'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<AlertDialogContentProps & {
  class?: HTMLAttributes['class']
}>()
const emits = defineEmits<AlertDialogContentEmits>()

const delegatedProps = reactiveOmit(props, 'class')

const forwarded = useForwardPropsEmits(delegatedProps, emits)

// PATCH: a11y — nome acessível de fallback quando o consumidor não renderiza
// AlertDialogTitle (ver PATCHES.md#vue-alert-dialog-fallback-label)
// O Title é obrigatório e já alimenta o aria-labelledby, então isto só entra em
// composição fora do contrato — por isso o ramo não tem story.
const attrs = useAttrs()
/* v8 ignore next */
const fallbackLabel = computed(() => (attrs['aria-labelledby'] ? undefined : 'AlertDialog'))
</script>

<template>
  <!--
    `aria-modal` sai deste wrapper: o primitivo desta stack isola o resto do
    documento com `aria-hidden` e não emite o atributo (conferido em
    node_modules), enquanto o contrato de markup do design system o promete.
    Incondicional de propósito — a raiz do alert dialog não expõe `modal`, ela
    é sempre modal por definição do papel.
  -->
  <AlertDialogPortal>
    <AlertDialogOverlay
      data-slot="alert-dialog-overlay"
      class="nds-alert-dialog-overlay"
    />
    <AlertDialogContent
      data-slot="alert-dialog-content"
      v-bind="{ 'aria-modal': 'true', 'aria-label': fallbackLabel, ...$attrs, ...forwarded }"
      :class="cn( 'nds-alert-dialog-content', props.class, )"
    >
      <slot />
    </AlertDialogContent>
  </AlertDialogPortal>
</template>
