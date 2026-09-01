<script setup lang="ts">
import { computed, inject, provide, type HTMLAttributes } from 'vue';
import { cn } from '@/lib/utils';
import { STEPPER_ITEM_KEY, STEPPER_KEY, type StepperState } from './stepper.context';

/**
 * Uma etapa.
 *
 * O estado é DERIVADO da comparação entre o número desta etapa e o valor atual
 * do fluxo — `completed` explícito só é necessário quando o fluxo aceita ordem
 * fora do comum, e por isso vence a comparação.
 *
 * O traço vive DENTRO do item, depois do gatilho, como a folha documenta. É
 * isso que faz `.nds-stepper-item[data-state="completed"] .nds-stepper-separator`
 * alcançá-lo sem regra extra.
 */
const props = withDefaults(defineProps<{
  /** Número desta etapa, contando de 1. */
  step: number;
  /** Conta como concluída mesmo estando depois da atual. */
  completed?: boolean;
  /** Indisponível: o gatilho sai da ordem de tabulação. */
  disabled?: boolean;
  class?: HTMLAttributes['class'];
}>(), {
  completed: false,
  disabled: false,
});

const root = inject(STEPPER_KEY, null);

const state = computed<StepperState>(() => {
  const value = root?.value.value ?? 1;
  if (props.completed || props.step < value) return 'completed';
  if (props.step === value) return 'active';
  return 'inactive';
});

provide(STEPPER_ITEM_KEY, {
  step: computed(() => props.step),
  state,
  disabled: computed(() => props.disabled),
});
</script>

<template>
  <li
    data-slot="stepper-item"
    :data-step="step"
    :data-state="state"
    :data-completed="completed ? '' : undefined"
    :data-disabled="disabled ? '' : undefined"
    :class="cn('nds-stepper-item', props.class)"
  >
    <slot :state="state" />
  </li>
</template>
