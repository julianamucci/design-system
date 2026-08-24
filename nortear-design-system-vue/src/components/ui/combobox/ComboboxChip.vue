<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { injectComboboxRootContext } from 'reka-ui'
import { computed, toRef } from 'vue'
import { cn } from '@/lib/utils'
import { provideComboboxChipContext } from './index'

const props = defineProps<{
  /** Valor que este chip representa dentro do modelo da raiz. */
  value: string
  class?: HTMLAttributes['class']
}>()

const rootContext = injectComboboxRootContext()

/*
 * O texto e o botão de remover chegam pelo slot padrão, lado a lado, porque é
 * essa a forma que o conteúdo compartilhado ensina. A referência Vanilla ainda
 * embrulha o texto num `[data-slot="combobox-chip-text"]`; aqui esse nó não
 * existe, e a divergência é deliberada: envolvê-lo exigiria um slot nomeado só
 * para o botão, e o exemplo publicado deixaria de compilar. Nenhuma folha e
 * nenhum atributo de acessibilidade dependem daquele nó.
 */
provideComboboxChipContext({ value: toRef(props, 'value') })

const disabled = computed(() => rootContext.disabled.value)
</script>

<template>
  <span
    data-slot="combobox-chip"
    :data-value="props.value"
    :data-disabled="disabled ? '' : undefined"
    :class="cn('nds-combobox-chip', props.class)"
  >
    <slot />
  </span>
</template>
