<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { TabsRoot, useForwardPropsEmits } from 'reka-ui'
import { cn } from '@/lib/utils'

interface TabsRootProps {
  defaultValue?: string | number
  modelValue?: string | number
  orientation?: 'horizontal' | 'vertical'
  dir?: 'ltr' | 'rtl'
  activationMode?: 'automatic' | 'manual'
  unmountOnHide?: boolean
  asChild?: boolean
  as?: any
}
type TabsRootEmits = {
  'update:modelValue': [value: string | number]
}

const props = defineProps<TabsRootProps & { class?: HTMLAttributes['class'] }>()
const emits = defineEmits<TabsRootEmits>()

const delegatedProps = reactiveOmit(props, 'class')
const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <TabsRoot
    v-slot="slotProps"
    data-slot="tabs"
    :data-orientation="forwarded.orientation || 'horizontal'"
    v-bind="forwarded"
    :class="cn('nds-tabs', props.class)"
  >
    <slot v-bind="slotProps" />
  </TabsRoot>
</template>
