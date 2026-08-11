<script setup lang="ts">
import type { DialogContentEmits, DialogContentProps } from 'reka-ui'

import type { HTMLAttributes } from 'vue'
import { computed } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { XIcon } from 'lucide-vue-next'
import {
  DialogClose,
  DialogContent,
  DialogPortal,
  injectDialogRootContext,
  useForwardPropsEmits,
} from 'reka-ui'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import SheetOverlay from './SheetOverlay.vue'

interface SheetContentProps extends DialogContentProps {
  class?: HTMLAttributes['class']
  side?: 'top' | 'right' | 'bottom' | 'left'
  showCloseButton?: boolean
}

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<SheetContentProps>(), {
  side: 'right',
  showCloseButton: true,
})
const emits = defineEmits<DialogContentEmits>()

const delegatedProps = reactiveOmit(props, 'class', 'side', 'showCloseButton')

const forwarded = useForwardPropsEmits(delegatedProps, emits)

// O primitivo desta stack isola o resto do documento com `aria-hidden` e NÃO
// emite `aria-modal` (conferido em node_modules). O contrato de markup do
// design system promete o atributo, então quem o emite é este wrapper — lendo
// do contexto da raiz para que um painel não-modal não o receba.
const rootContext = injectDialogRootContext()
const ariaModal = computed(() => (rootContext.modal.value ? 'true' : undefined))
</script>

<template>
  <DialogPortal>
    <SheetOverlay />
    <DialogContent
      data-slot="sheet-content"
      :data-side="side"
      :class="cn('nds-sheet-content', props.class)"
      v-bind="{ 'aria-modal': ariaModal, 'aria-label': $attrs['aria-labelledby'] ? undefined : 'Sheet', ...$attrs, ...forwarded }"
    >
      <slot />

      <DialogClose
        v-if="showCloseButton"
        data-slot="sheet-close"
        as-child
      >
        <Button
          variant="ghost"
          class="nds-sheet-close-position"
          size="icon-sm"
        >
          <XIcon />
          <span class="nds-sr-only">Fechar</span>
        </Button>
      </DialogClose>
    </DialogContent>
  </DialogPortal>
</template>
