<script setup lang="ts">
import type { DropdownMenuCheckboxItemEmits, DropdownMenuCheckboxItemProps } from 'reka-ui'

import type { HTMLAttributes } from 'vue'
import { computed } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { CheckIcon, MinusIcon } from 'lucide-vue-next'
import {
  DropdownMenuCheckboxItem,
  DropdownMenuItemIndicator,
  useForwardPropsEmits,
} from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<DropdownMenuCheckboxItemProps & { class?: HTMLAttributes['class'] }>()
const emits = defineEmits<DropdownMenuCheckboxItemEmits>()

const delegatedProps = reactiveOmit(props, 'class')

const forwarded = useForwardPropsEmits(delegatedProps, emits)

/**
 * O símbolo do estado misto é TRAÇO, não tique.
 *
 * Tique quer dizer "marcado", e misto não é isso — é "alguns dos filhos". Ver a
 * nota longa no item de marcação da barra de menus: o indicador da lib não
 * entrega o estado ao slot, o item público também não, e por isso a única fonte
 * é o valor que este componente já recebe.
 */
const misto = computed(() => props.modelValue === 'indeterminate')
</script>

<template>
  <DropdownMenuCheckboxItem
    data-slot="dropdown-menu-checkbox-item"
    v-bind="forwarded"
    :class="cn('nds-dropdown-menu-checkbox-item', props.class)"
  >
    <span
      class="nds-dropdown-menu-item-indicator"
      data-slot="dropdown-menu-checkbox-item-indicator"
    >
      <DropdownMenuItemIndicator>
        <slot name="indicator-icon">
          <MinusIcon v-if="misto" />
          <CheckIcon v-else />
        </slot>
      </DropdownMenuItemIndicator>
    </span>
    <slot />
  </DropdownMenuCheckboxItem>
</template>
