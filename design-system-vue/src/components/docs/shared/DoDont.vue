<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  type: 'do' | 'dont';
  label?: string;
  description: string;
}>();

const config = computed(() => ({
  do: {
    baseClass: 'border-green-500/50 bg-green-500/5',
    iconClass: 'text-green-500',
    defaultLabel: 'Faça isso',
    icon: 'M20 6L9 17l-5-5',
  },
  dont: {
    baseClass: 'border-red-500/50 bg-red-500/5',
    iconClass: 'text-red-500',
    defaultLabel: 'Não faça isso',
    icon: 'M18 6L6 18M6 6l12 12',
  },
}[props.type]));
</script>

<template>
  <div :class="['p-4 rounded-lg border-l-4 space-y-2', config.baseClass]">
    <div class="flex items-center gap-2">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="3"
        stroke-linecap="round"
        stroke-linejoin="round"
        :class="config.iconClass"
      >
        <path :d="config.icon" />
      </svg>
      <span class="text-xs font-bold uppercase tracking-wider">{{ label || config.defaultLabel }}</span>
    </div>
    <p class="text-sm text-foreground/80 leading-relaxed">{{ description }}</p>
    <div v-if="$slots.default" class="pt-2"><slot /></div>
  </div>
</template>
