<script setup lang="ts">
import type { DialogContentEmits, DialogContentProps } from 'reka-ui'

import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { XIcon } from 'lucide-vue-next'
import {
  DialogClose,
  DialogContent,
  DialogOverlay,
  DialogPortal,
  useForwardPropsEmits,
} from 'reka-ui'
import { cn } from '@/lib/utils'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<DialogContentProps & { class?: HTMLAttributes['class'] }>()
const emits = defineEmits<DialogContentEmits>()

const delegatedProps = reactiveOmit(props, 'class')

const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <DialogPortal>
    <!--
      Os `data-slot` são o contrato de markup que as cinco stacks compartilham:
      sem eles esta variante ficava invisível para toda consulta que procura o
      painel, o overlay ou o botão de fechar — inclusive as dos testes.
    -->
    <DialogOverlay
      data-slot="dialog-overlay"
      class="nds-dialog-overlay nds-dialog-overlay-scroll"
    >
      <DialogContent
        data-slot="dialog-content"
        :class="cn( 'nds-dialog-content nds-dialog-content-scroll', props.class, )"
        v-bind="{ ...$attrs, ...forwarded }"
        @pointer-down-outside="(event) => {
          const originalEvent = event.detail.originalEvent;
          const target = originalEvent.target as HTMLElement;
          if (originalEvent.offsetX > target.clientWidth || originalEvent.offsetY > target.clientHeight) {
            event.preventDefault();
          }
        }"
      >
        <slot />

        <DialogClose
          data-slot="dialog-close"
          class="nds-dialog-close"
        >
          <XIcon />
          <span class="nds-sr-only">Close</span>
        </DialogClose>
      </DialogContent>
    </DialogOverlay>
  </DialogPortal>
</template>
