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
  <div
    data-slot="card"
    :data-size="size"
    :class="cn(
      // PATCH: bugfix — has-[>[data-slot=card-footer]] restringe a filho direto para não zerar pb em Cards aninhados com footer (ver PATCHES.md#card-footer-direct-child)
      'ring-foreground/10 bg-card text-card-foreground gap-4 overflow-hidden rounded-(--radius-card) py-4 text-sm ring-1 has-[>[data-slot=card-footer]]:pb-0 has-[>img:first-child]:pt-0 data-[size=sm]:gap-3 data-[size=sm]:py-3 data-[size=sm]:has-[>[data-slot=card-footer]]:pb-0 *:[img:first-child]:rounded-t-(--radius-card) *:[img:last-child]:rounded-b-(--radius-card) group/card flex flex-col',
      props.class,
    )"
  >
    <slot />
  </div>
</template>
