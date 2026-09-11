<script setup lang="ts">
import type { DropdownMenuContentEmits, DropdownMenuContentProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import {
  DropdownMenuContent,
  DropdownMenuPortal,
  useForwardPropsEmits,
} from 'reka-ui'
import { cn } from '@/lib/utils'
import { useDropdownMenuTabLeaves } from './tab-leaves-menu'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<DropdownMenuContentProps & { class?: HTMLAttributes['class'] }>(),
  {
    align: 'start',
    sideOffset: 4,
  },
)
const emits = defineEmits<DropdownMenuContentEmits>()

const delegatedProps = reactiveOmit(props, 'class')

const forwarded = useForwardPropsEmits(delegatedProps, emits)

/**
 * Tab sai do menu e o fecha (C2), sem desligar `modal` — ver
 * `tab-leaves-menu.ts`. O `closeAutoFocus` de quem consome chega pelo
 * `forwarded` e roda antes deste; o da lib vem depois e respeita o
 * `preventDefault` que o destino do Tab faz.
 */
// PATCH: a11y — a reka prende o Tab no menu modal (ver PATCHES.md#vue-menu-tab-leaves)
const { onKeydownCapture, onCloseAutoFocus } = useDropdownMenuTabLeaves()
</script>

<template>
  <DropdownMenuPortal>
    <DropdownMenuContent
      data-slot="dropdown-menu-content"
      v-bind="{ ...$attrs, ...forwarded }"
      :class="cn('nds-dropdown-menu-content', props.class)"
      @keydown.capture="onKeydownCapture"
      @close-auto-focus="onCloseAutoFocus"
    >
      <slot />
    </DropdownMenuContent>
  </DropdownMenuPortal>
</template>
