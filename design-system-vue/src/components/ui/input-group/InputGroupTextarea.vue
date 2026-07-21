<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'
import { Textarea } from '@/components/ui/textarea'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <Textarea
    data-slot="input-group-control"
    :class="cn( 'nds-input-group-control', props.class, )"
  />
</template>
