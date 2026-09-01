<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { cn } from '@/lib/utils';

/** Nome curto da etapa. Vive fora do círculo, então nunca é recortado. */
const props = defineProps<{
  class?: HTMLAttributes['class'];
}>();
</script>

<template>
  <span
    data-slot="stepper-title"
    :class="cn('nds-stepper-title', props.class)"
  >
    <slot />
  </span>
</template>
