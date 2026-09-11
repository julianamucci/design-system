<script setup lang="ts">
import type { ContextMenuRadioItemEmits, ContextMenuRadioItemProps } from 'reka-ui'

import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { CheckIcon } from 'lucide-vue-next'
import {
  ContextMenuItemIndicator,
  ContextMenuRadioItem,
  useForwardPropsEmits,
} from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<ContextMenuRadioItemProps & { class?: HTMLAttributes['class'] }>()
const emits = defineEmits<ContextMenuRadioItemEmits>()

const delegatedProps = reactiveOmit(props, 'class')

const forwarded = useForwardPropsEmits(delegatedProps, emits)

/**
 * Escolher uma opção NÃO fecha o menu — mesma decisão e mesmo mecanismo do
 * `ContextMenuCheckboxItem.vue`: a reka fecha em toda escolha a menos que o
 * `select` volte com `preventDefault`. O ouvinte de quem consome vem no
 * `forwarded` e roda antes deste, com o evento intacto.
 */
function keepOpen(event: Event) {
  // PATCH: bugfix — a reka fecha o menu em toda escolha; escolher a opção não fecha (ver PATCHES.md#vue-context-menu-keep-open)
  event.preventDefault()
}
</script>

<template>
  <ContextMenuRadioItem
    data-slot="context-menu-radio-item"
    v-bind="forwarded"
    :class="cn('nds-dropdown-menu-radio-item', props.class)"
    @select="keepOpen"
  >
    <span
      class="nds-dropdown-menu-item-indicator"
      data-slot="context-menu-radio-item-indicator"
    >
      <ContextMenuItemIndicator>
        <slot name="indicator-icon">
          <CheckIcon />
        </slot>
      </ContextMenuItemIndicator>
    </span>
    <slot />
  </ContextMenuRadioItem>
</template>
