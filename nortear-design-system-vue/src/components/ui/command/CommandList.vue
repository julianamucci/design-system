<script setup lang="ts">
import type { ListboxContentProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { ListboxContent, useForwardProps } from 'reka-ui'
import { cn } from '@/lib/utils'
import { useCommand } from './index'

const props = defineProps<ListboxContentProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = reactiveOmit(props, 'class')

const forwarded = useForwardProps(delegatedProps)

// O id vem da raiz porque é o alvo do `aria-controls` do campo de busca, que é
// irmão desta lista. Sem ele o `role="combobox"` aponta para um id órfão.
const { listId } = useCommand()
</script>

<template>
  <ListboxContent
    :id="listId"
    data-slot="command-list"
    v-bind="forwarded"
    :aria-label="($attrs['aria-label'] as string) || 'Resultados'"
    :class="cn('nds-command-list', props.class)"
  >
    <slot />
  </ListboxContent>
</template>
