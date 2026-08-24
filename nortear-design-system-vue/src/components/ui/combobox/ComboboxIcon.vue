<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { ChevronDownIcon } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

const props = defineProps<{ class?: HTMLAttributes['class'] }>()
</script>

<template>
  <ChevronDownIcon
    data-slot="combobox-icon"
    aria-hidden="true"
    :class="cn('nds-combobox-icon', props.class)"
  />
</template>
