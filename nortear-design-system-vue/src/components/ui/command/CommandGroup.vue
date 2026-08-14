<script setup lang="ts">
import type { ListboxGroupProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { ListboxGroup, ListboxGroupLabel, useId } from 'reka-ui'
import { computed, onMounted, onUnmounted } from 'vue'
import { cn } from '@/lib/utils'
import { provideCommandGroupContext, useCommand } from './index'

const props = defineProps<ListboxGroupProps & {
  class?: HTMLAttributes['class']
  heading?: string
}>()

const delegatedProps = reactiveOmit(props, 'class')

const { allGroups, filterState } = useCommand()
const id = useId()

const isRender = computed(() => !filterState.search ? true : filterState.filtered.groups.has(id))

provideCommandGroupContext({ id })
onMounted(() => {
  if (!allGroups.value.has(id))
    allGroups.value.set(id, new Set())
})
onUnmounted(() => {
  allGroups.value.delete(id)
})
</script>

<template>
  <!--
    Sem `heading` o rótulo não é renderizado, e o `aria-labelledby` que o
    primitivo escreve sozinho passa a apontar para um id que não existe. O
    `null` REMOVE o atributo (atributo fantasma é referência quebrada na árvore
    de acessibilidade); grupo sem rótulo simplesmente não tem nome.
  -->
  <ListboxGroup
    v-bind="{ ...delegatedProps, ...(heading ? {} : { 'aria-labelledby': null }) }"
    :id="id"
    data-slot="command-group"
    :class="cn('nds-command-group', props.class)"
    :hidden="isRender ? undefined : true"
  >
    <!--
      A classe é o contrato: o CSS compartilhado estiliza
      `.nds-command-group-heading` (12px, peso médio, `--muted-foreground`).
      Com `class=""` o cabeçalho de grupo desta stack não recebia estilo nenhum
      e saía do tamanho e da cor que as outras stacks mostram.
    -->
    <ListboxGroupLabel
      v-if="heading"
      data-slot="command-group-heading"
      class="nds-command-group-heading"
    >
      {{ heading }}
    </ListboxGroupLabel>
    <slot />
  </ListboxGroup>
</template>
