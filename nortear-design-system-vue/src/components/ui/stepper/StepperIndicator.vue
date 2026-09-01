<script setup lang="ts">
import { computed, inject, type HTMLAttributes } from 'vue';
import { Check } from 'lucide-vue-next';
import { cn } from '@/lib/utils';
import { STEPPER_ITEM_KEY } from './stepper.context';

/**
 * Círculo numerado.
 *
 * `aria-hidden` porque o número repete a posição que a `<ol>` já anuncia — ler
 * os dois faz o leitor de tela dizer a mesma coisa duas vezes.
 *
 * Concluída, o número dá lugar a uma marca de verificação: é FORMA, e é ela que
 * mantém o estado legível em tela monocromática e para quem não distingue as
 * cores. Conteúdo próprio entra pelo slot e substitui os dois.
 */
const props = defineProps<{
  class?: HTMLAttributes['class'];
}>();

const item = inject(STEPPER_ITEM_KEY, null);

const state = computed(() => item?.state.value ?? 'inactive');
const step = computed(() => item?.step.value ?? 1);
</script>

<template>
  <span
    data-slot="stepper-indicator"
    aria-hidden="true"
    :class="cn('nds-stepper-indicator', props.class)"
  >
    <slot>
      <Check
        v-if="state === 'completed'"
        class="nds-icon"
      />
      <template v-else>
        {{ step }}
      </template>
    </slot>
  </span>
</template>
