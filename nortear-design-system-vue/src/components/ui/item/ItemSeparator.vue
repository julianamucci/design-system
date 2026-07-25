<script setup lang="ts">
import type { SeparatorProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'

const props = defineProps<
  SeparatorProps & { class?: HTMLAttributes['class'] }
>()
</script>

<template>
  <Separator
    data-slot="item-separator"
    orientation="horizontal"
    :class="cn('nds-mt-2 nds-mb-2', props.class)"
  />
</template>
