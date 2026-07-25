<script setup lang="ts">
import type { HTMLAttributes } from 'vue'

import { Loader2Icon } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <Loader2Icon
    role="status"
    aria-label="Loading"
    :class="cn('nds-size-4 nds-animate-spin', props.class)"
  />
</template>
