<script setup lang="ts">
import type { ContextMenuLabelProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { ContextMenuLabel } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<ContextMenuLabelProps & { class?: HTMLAttributes['class'], inset?: boolean }>()

// `inset` sai como `data-inset`, que é o que a folha lê — repassado à lib, caía
// no DOM como atributo cru (ver `ContextMenuItem.vue`).
const delegatedProps = reactiveOmit(props, 'inset', 'class')
</script>

<template>
  <ContextMenuLabel
    data-slot="context-menu-label"
    :data-inset="inset ? '' : undefined"
    v-bind="delegatedProps"
    :class="cn('nds-dropdown-menu-label', props.class)"
  >
    <slot />
  </ContextMenuLabel>
</template>
