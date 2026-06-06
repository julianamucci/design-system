<script setup lang="ts">
import type { PaginationListProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { PaginationList } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<PaginationListProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = reactiveOmit(props, 'class')
</script>

<template>
  <PaginationList
    v-slot="slotProps"
    as="ul"
    role="list"
    data-slot="pagination-content"
    :class="cn('gap-0.5 flex items-center list-none p-0 m-0', props.class)"
  >
    <slot v-bind="slotProps" />
  </PaginationList>
</template>
