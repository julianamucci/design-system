<script setup lang="ts">
import type { SliderRootEmits, SliderRootProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { computed, useAttrs } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { SliderRange, SliderRoot, SliderThumb, SliderTrack, useForwardPropsEmits } from 'reka-ui'
import { cn } from '@/lib/utils'

defineOptions({ inheritAttrs: false })

const props = defineProps<SliderRootProps & { class?: HTMLAttributes['class'] }>()
const emits = defineEmits<SliderRootEmits>()

const delegatedProps = reactiveOmit(props, 'class')

const forwarded = useForwardPropsEmits(delegatedProps, emits)

const attrs = useAttrs()
const thumbLabel = computed(() => (attrs['aria-label'] as string | undefined) ?? undefined)
const thumbLabelledBy = computed(() => (attrs['aria-labelledby'] as string | undefined) ?? undefined)
const rootAttrs = computed(() => {
  const { 'aria-label': _a, 'aria-labelledby': _b, ...rest } = attrs as Record<string, unknown>
  return rest
})
</script>

<template>
  <SliderRoot
    v-slot="{ modelValue }"
    data-slot="slider"
    :data-vertical="props.orientation === 'vertical' ? '' : undefined"
    :class="cn( 'nds-slider', props.class, )"
    v-bind="{ ...forwarded, ...rootAttrs }"
  >
    <SliderTrack
      data-slot="slider-track"
      :data-horizontal="props.orientation !== 'vertical' ? '' : undefined"
      :data-vertical="props.orientation === 'vertical' ? '' : undefined"
      class="nds-slider-track"
    >
      <SliderRange
        data-slot="slider-range"
        :data-horizontal="props.orientation !== 'vertical' ? '' : undefined"
        :data-vertical="props.orientation === 'vertical' ? '' : undefined"
        class="nds-slider-range"
      />
    </SliderTrack>

    <SliderThumb
      v-for="(_, key) in modelValue"
      :key="key"
      data-slot="slider-thumb"
      :data-vertical="props.orientation === 'vertical' ? '' : undefined"
      :aria-label="thumbLabel"
      :aria-labelledby="thumbLabelledBy"
      class="nds-slider-thumb"
    />
  </SliderRoot>
</template>
