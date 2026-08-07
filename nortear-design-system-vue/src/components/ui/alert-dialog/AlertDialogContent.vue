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

// Nome acessível de última instância: o AlertDialogTitle é obrigatório e já
// alimenta o aria-labelledby, então isto só entra em composição fora do
// contrato — por isso o ramo não tem story. Sem ele, um painel sem título cai
// na violação aria-dialog-name do axe.
const attrs = useAttrs()
/* v8 ignore next */
const fallbackLabel = computed(() => (attrs['aria-labelledby'] ? undefined : 'AlertDialog'))
</script>

<template>
  <AlertDialogPortal>
    <AlertDialogOverlay
      data-slot="alert-dialog-overlay"
      class="nds-alert-dialog-overlay"
    />
    <AlertDialogContent
      data-slot="alert-dialog-content"
      v-bind="{ 'aria-label': fallbackLabel, ...$attrs, ...forwarded }"
      :class="cn( 'nds-alert-dialog-content', props.class, )"
    >
      <slot />
    </AlertDialogContent>
  </AlertDialogPortal>
</template>
