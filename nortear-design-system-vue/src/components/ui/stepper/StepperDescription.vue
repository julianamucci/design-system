<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { cn } from '@/lib/utils';

/** Texto de apoio da etapa, opcional. Fica legível para o leitor de tela. */
const props = defineProps<{
  class?: HTMLAttributes['class'];
}>();
</script>

<template>
  <span
    data-slot="stepper-description"
    :class="cn('nds-stepper-description', props.class)"
  >
    <slot />
  </span>
</template>
