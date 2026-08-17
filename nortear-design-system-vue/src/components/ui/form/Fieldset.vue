<script lang="ts" setup>
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{
  /** Texto da legenda. Leitores de tela a anunciam antes de cada campo. */
  legend?: string
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <fieldset data-slot="fieldset" :class="cn('nds-form-fieldset', props.class)">
    <!-- A legenda é o PRIMEIRO filho: fora da primeira posição ela deixa de
         rotular o <fieldset>, o texto continua na tela e o grupo fica anônimo. -->
    <legend v-if="legend" data-slot="fieldset-legend" class="nds-form-legend">
      {{ legend }}
    </legend>
    <slot />
  </fieldset>
</template>
