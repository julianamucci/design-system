<script setup lang="ts">
import type { ComboboxInputEmits, ComboboxInputProps } from 'reka-ui'

import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { SearchIcon } from 'lucide-vue-next'
import { ComboboxInput, useForwardPropsEmits } from 'reka-ui'
import { cn } from '@/lib/utils'
import { InputGroup, InputGroupAddon } from '@/components/ui/input-group'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<ComboboxInputProps & {
  class?: HTMLAttributes['class']
}>()

const emits = defineEmits<ComboboxInputEmits>()

const delegatedProps = reactiveOmit(props, 'class')

const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <InputGroup>
    <InputGroupAddon>
      <SearchIcon
        class="nds-size-4 nds-shrink-0"
        style="opacity: 0.5"
      />
    </InputGroupAddon>
    <ComboboxInput
      data-slot="combobox-input"
      :class="cn('nds-combobox-input', props.class)"
      v-bind="{ ...$attrs, ...forwarded }"
    />
  </InputGroup>
</template>
