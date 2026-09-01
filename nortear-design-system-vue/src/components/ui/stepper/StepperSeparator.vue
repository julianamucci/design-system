<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { cn } from '@/lib/utils';

/**
 * Traço até a próxima etapa.
 *
 * É desenho, e por isso sai da árvore de acessibilidade. Mora DENTRO do item,
 * depois do gatilho, e não entre os itens: assim herda o estado da etapa que o
 * precede e acompanha a cor de uma etapa concluída sem regra extra.
 */
const props = defineProps<{
  class?: HTMLAttributes['class'];
}>();
</script>

<template>
  <div
    data-slot="stepper-separator"
    aria-hidden="true"
    :class="cn('nds-stepper-separator', props.class)"
  />
</template>
