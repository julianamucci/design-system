<script lang="ts" setup>
import type { HTMLAttributes } from 'vue'

import { MoreHorizontalIcon } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <span
    data-slot="breadcrumb-ellipsis"
    role="presentation"
    aria-hidden="true"
    :class="cn('nds-breadcrumb-ellipsis', props.class)"
  >
    <slot>
      <MoreHorizontalIcon />
    </slot>
    <span class="nds-sr-only">More</span>
  </span>
</template>
