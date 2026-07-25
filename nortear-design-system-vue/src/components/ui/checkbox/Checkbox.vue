<script setup lang="ts">
import type { CheckboxRootEmits, CheckboxRootProps } from 'reka-ui'

import type { HTMLAttributes } from 'vue'
import { computed } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { CheckIcon } from 'lucide-vue-next'
import { CheckboxIndicator, CheckboxRoot, useForwardPropsEmits } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<CheckboxRootProps & {
  class?: HTMLAttributes['class']
  /** Alias compatível com `<input type="checkbox" checked>`. Mapeia para defaultValue quando modelValue não está controlado. */
  checked?: boolean | 'indeterminate'
}>()
const emits = defineEmits<CheckboxRootEmits>()

const delegatedProps = reactiveOmit(props, 'class', 'checked')

const resolvedDefault = computed(() => {
  if (props.defaultValue !== undefined) return props.defaultValue
  if (props.checked !== undefined) return props.checked
  return undefined
})

const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <CheckboxRoot
    v-slot="slotProps"
    data-slot="checkbox"
    v-bind="forwarded"
    :default-value="resolvedDefault"
    :class="cn('nds-checkbox', props.class)"
  >
    <CheckboxIndicator
      data-slot="checkbox-indicator"
      class="nds-checkbox-indicator"
    >
      <slot v-bind="slotProps">
        <CheckIcon />
      </slot>
    </CheckboxIndicator>
  </CheckboxRoot>
</template>
