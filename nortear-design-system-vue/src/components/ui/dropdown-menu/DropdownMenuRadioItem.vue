<script setup lang="ts">
import type { DropdownMenuRadioItemEmits, DropdownMenuRadioItemProps } from 'reka-ui'

import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { CheckIcon } from 'lucide-vue-next'
import {
  DropdownMenuItemIndicator,
  DropdownMenuRadioItem,
  useForwardPropsEmits,
} from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<DropdownMenuRadioItemProps & { class?: HTMLAttributes['class'] }>()

const emits = defineEmits<DropdownMenuRadioItemEmits>()

const delegatedProps = reactiveOmit(props, 'class')

const forwarded = useForwardPropsEmits(delegatedProps, emits)

/**
 * Escolher uma opção NÃO fecha o menu — mesma decisão e mesmo mecanismo do
 * `DropdownMenuCheckboxItem.vue`, e como no vanilla e no react, que deixam o
 * painel aberto depois da escolha. O ouvinte de quem consome vem no `forwarded`
 * e roda antes deste, com o evento intacto; a lib aplica o valor de qualquer
 * jeito.
 */
// PATCH: bugfix — escolher não fecha o menu, como no vanilla (ver PATCHES.md#vue-menu-select-keeps-open)
function keepMenuOpen(event: Event) {
  event.preventDefault()
}
</script>

<template>
  <DropdownMenuRadioItem
    data-slot="dropdown-menu-radio-item"
    v-bind="forwarded"
    :class="cn('nds-dropdown-menu-radio-item', props.class)"
    @select="keepMenuOpen"
  >
    <span
      class="nds-dropdown-menu-item-indicator"
      data-slot="dropdown-menu-radio-item-indicator"
    >
      <DropdownMenuItemIndicator>
        <slot name="indicator-icon">
          <CheckIcon />
        </slot>
      </DropdownMenuItemIndicator>
    </span>
    <slot />
  </DropdownMenuRadioItem>
</template>
