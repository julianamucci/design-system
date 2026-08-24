<script setup lang="ts">
import type { ComboboxGroupProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { ComboboxGroup, useId } from 'reka-ui'
import { cn } from '@/lib/utils'
import { provideComboboxGroupContext } from './index'

const props = defineProps<ComboboxGroupProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = reactiveOmit(props, 'class')

/*
 * O `aria-labelledby` é escrito aqui, e não deixado para a lib: lá o id do
 * cabeçalho nasce no `setup` do próprio cabeçalho, DEPOIS de o grupo já ter
 * renderizado, e a primeira renderização saía com o atributo vazio — referência
 * quebrada na árvore de acessibilidade.
 */
const labelId = useId(undefined, 'nds-combobox-group-label')
provideComboboxGroupContext({ labelId })
</script>

<template>
  <ComboboxGroup
    v-bind="delegatedProps"
    data-slot="combobox-group"
    :aria-labelledby="labelId"
    :class="cn('nds-combobox-group', props.class)"
  >
    <slot />
  </ComboboxGroup>
</template>
