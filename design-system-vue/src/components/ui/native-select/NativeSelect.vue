<script setup lang="ts">
import type { AcceptableValue } from 'reka-ui'

import type { HTMLAttributes } from 'vue'
import { reactiveOmit, useVModel } from '@vueuse/core'
import { ChevronDownIcon } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<{
  modelValue?: AcceptableValue | AcceptableValue[]
  class?: HTMLAttributes['class']
  size?: 'sm' | 'default'
}>()

const emit = defineEmits<{
  'update:modelValue': AcceptableValue
}>()

const modelValue = useVModel(props, 'modelValue', emit, {
  passive: true,
  defaultValue: '',
})

const delegatedProps = reactiveOmit(props, 'class', 'size')
</script>

<template>
  <div
    class="nds-native-select"
    data-slot="native-select-wrapper"
    :data-size="props.size ?? 'default'"
  >
    <select
      v-bind="{ ...$attrs, ...delegatedProps }"
      v-model="modelValue"
      data-slot="native-select"
      :data-size="props.size ?? 'default'"
      :class="cn(
        'nds-native-select-input',
        props.class,
      )"
    >
      <slot />
    </select>
    <ChevronDownIcon
      class="text-muted-foreground top-1/2 right-2.5 size-4 -translate-y-1/2 pointer-events-none absolute select-none"
      aria-hidden="true"
      data-slot="native-select-icon"
    />
  </div>
</template>
