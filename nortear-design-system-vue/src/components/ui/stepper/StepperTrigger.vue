<script setup lang="ts">
import { computed, inject, type HTMLAttributes } from 'vue';
import { cn } from '@/lib/utils';
import { STEPPER_ITEM_KEY, STEPPER_KEY } from './stepper.context';

/**
 * Controle da etapa.
 *
 * `type="button"` explícito: dentro de um `<form>` — que é o caso de todo
 * wizard — um botão sem `type` é `submit`, e clicar numa etapa enviaria o
 * formulário.
 *
 * O `.nds-sr-only` leva ao leitor de tela a palavra que a marca de verificação
 * só diz por desenho. Ele fica sempre no DOM, vazio quando a etapa ainda não
 * foi alcançada, para que a troca de estado não insira nó no meio do conteúdo
 * que quem consome montou.
 */
const props = defineProps<{
  class?: HTMLAttributes['class'];
}>();

const root = inject(STEPPER_KEY, null);
const item = inject(STEPPER_ITEM_KEY, null);

const state = computed(() => item?.state.value ?? 'inactive');
const disabled = computed(() => item?.disabled.value ?? false);

const stateLabel = computed(() => {
  const labels = root?.labels.value ?? {};
  if (state.value === 'completed') return labels.completed ?? '';
  if (state.value === 'active') return labels.current ?? '';
  return '';
});

function handleClick() {
  if (disabled.value || !item || !root) return;
  root.select(item.step.value);
}
</script>

<template>
  <button
    type="button"
    data-slot="stepper-trigger"
    :aria-current="state === 'active' ? 'step' : undefined"
    :disabled="disabled"
    :class="cn('nds-stepper-trigger', props.class)"
    @click="handleClick"
  >
    <span
      class="nds-sr-only"
      data-slot="stepper-state-label"
    >
      {{ stateLabel }}
    </span>
    <slot />
  </button>
</template>
