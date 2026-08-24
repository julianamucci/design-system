<script setup lang="ts">
import type { ComboboxGroupProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { ComboboxGroup, useId } from 'reka-ui'
import { computed, ref } from 'vue'
import { cn } from '@/lib/utils'
import { provideComboboxGroupContext, useComboboxContext } from './index'

const props = defineProps<ComboboxGroupProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = reactiveOmit(props, 'class')

/*
 * O `aria-labelledby` é escrito aqui, e não deixado para a lib: lá o id do
 * cabeçalho nasce no `setup` do próprio cabeçalho, DEPOIS de o grupo já ter
 * renderizado, e a primeira renderização saía com o atributo vazio — referência
 * quebrada na árvore de acessibilidade.
 */
const labelId = useId(undefined, 'nds-combobox-group-label')

const visibleValues = ref(new Set<string>())
provideComboboxGroupContext({ labelId, visibleValues })

const { filter } = useComboboxContext()

/*
 * Grupo sem nenhuma opção é cabeçalho sobre lugar nenhum — e, na árvore de
 * acessibilidade, um `group` vazio que ainda é contado e anunciado.
 *
 * Só entra em cena com filtro do consumidor: aí a lib está desligada por
 * `ignoreFilter`, e o esconde-grupo dela também. Sem filtro do consumidor, a
 * decisão continua inteira com a lib e esta linha nunca é verdadeira.
 *
 * `hidden` em vez de `v-if`: o grupo tem de continuar montado para que as
 * opções dentro dele sigam recalculando e o devolvam à tela quando a busca
 * mudar. Desmontado, ele levaria junto quem lhe diria para voltar.
 */
const isHidden = computed(() => filter.value !== undefined && visibleValues.value.size === 0)
</script>

<template>
  <ComboboxGroup
    v-bind="delegatedProps"
    data-slot="combobox-group"
    :aria-labelledby="labelId"
    :hidden="isHidden"
    :class="cn('nds-combobox-group', props.class)"
  >
    <slot />
  </ComboboxGroup>
</template>
