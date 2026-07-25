<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = withDefaults(defineProps<{
  class?: HTMLAttributes['class']
  size?: 'default' | 'sm'
}>(), {
  size: 'default',
})
</script>

<template>
  <!--
    PATCH: bugfix — has-[>[data-slot=card-footer]] restringe a filho direto para
    não zerar pb em Cards aninhados com footer (ver PATCHES.md#card-footer-direct-child).
  -->
  <div
    data-slot="card"
    :data-size="size"
    :class="cn('nds-card', props.class)"
  >
    <slot />
  </div>
</template>
