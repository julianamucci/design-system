<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { computed, onMounted, ref, inject } from 'vue'
import { cn } from '@/lib/utils'
import { useChart } from '.'
import type { ChartConfig } from '.'

const props = withDefaults(defineProps<{
  hideIcon?: boolean
  nameKey?: string
  verticalAlign?: 'bottom' | 'top'
  config?: ChartConfig
  class?: HTMLAttributes['class']
}>(), {
  verticalAlign: 'bottom',
})

// config pode vir via prop (uso standalone) ou via contexto ChartContainer
const chartContext = (() => {
  try { return useChart() } catch { return null }
})()

const resolvedConfig = computed(() => props.config ?? chartContext?.config.value ?? {})
const resolvedId = computed(() => chartContext?.id ?? '')

const payload = computed(() => Object.entries(resolvedConfig.value).map(([key]) => {
  return {
    key: props.nameKey || key,
    itemConfig: resolvedConfig.value[key],
  }
}))

const containerSelector = ref('')
onMounted(() => {
  if (resolvedId.value) {
    containerSelector.value = `[data-chart="chart-${resolvedId.value}"]>[data-vis-xy-container]`
  } else {
    containerSelector.value = 'standalone'
  }
})
</script>

<template>
  <div
    v-if="containerSelector || payload.length"
    :class="cn(
      'flex items-center justify-center gap-4',
      verticalAlign === 'top' ? 'pb-3' : 'pt-3',
      props.class,
    )"
  >
    <div
      v-for="{ key, itemConfig } in payload"
      :key="key"
      :class="cn(
        '[&>svg]:text-muted-foreground flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3',
      )"
    >
      <component :is="itemConfig?.icon" v-if="itemConfig?.icon" />
      <div
        v-else
        class="h-2 w-2 shrink-0 rounded-[2px]"
        :style="{
          backgroundColor: itemConfig?.color,
        }"
      />

      {{ itemConfig?.label }}
    </div>
  </div>
</template>
