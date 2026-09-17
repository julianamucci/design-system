<script setup lang="ts">
import type { PopoverAnchorProps } from 'reka-ui'
import type { ComponentPublicInstance } from 'vue'
import { inject, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { PopoverAnchor } from 'reka-ui'
import { POPOVER_ANCHOR } from './popover.context'

const props = defineProps<PopoverAnchorProps>()

// A âncora declarada vence o gatilho, como na lib — e o painel precisa do
// elemento para o `alignOffset` valer com `align="center"` (ver
// `POPOVER_ANCHOR` no `popover.context.ts`).
const anchor = inject(POPOVER_ANCHOR, null)
const anchorRef = ref<ComponentPublicInstance | null>(null)

onMounted(async () => {
  await nextTick()
  const el = anchorRef.value?.$el as HTMLElement | undefined
  if (anchor && el?.nodeType === Node.ELEMENT_NODE) anchor.custom.value = el
})

onBeforeUnmount(() => {
  if (anchor && anchor.custom.value === anchorRef.value?.$el) anchor.custom.value = null
})
</script>

<template>
  <PopoverAnchor
    ref="anchorRef"
    data-slot="popover-anchor"
    v-bind="props"
  >
    <slot />
  </PopoverAnchor>
</template>
