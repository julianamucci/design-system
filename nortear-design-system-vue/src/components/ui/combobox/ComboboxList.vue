<script setup lang="ts">
import type { ComboboxContentEmits, ComboboxContentProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { ComboboxContent, useForwardPropsEmits } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = withDefaults(
  defineProps<ComboboxContentProps & { class?: HTMLAttributes['class'] }>(),
  {
    // Sem nenhuma opção sobrando, quem fica na tela é a mensagem de lista
    // vazia, que é IRMÃ desta lista. Uma lista com papel de `listbox` e nenhuma
    // opção dentro é uma caixa vazia com borda, e uma promessa quebrada na
    // árvore de acessibilidade.
    hideWhenEmpty: true,
  },
)
const emits = defineEmits<ComboboxContentEmits>()

const delegatedProps = reactiveOmit(props, 'class')
const forwarded = useForwardPropsEmits(delegatedProps, emits)

/*
 * É este elemento que carrega `role="listbox"` e o `id` para o qual o campo de
 * texto aponta em `aria-controls` — a lib junta as duas coisas num nó só.
 *
 * `position` fica no padrão (em fluxo). O modo flutuante da lib traria um
 * embrulho próprio, fora do alcance de qualquer classe, e a caixa deste design
 * system é ancorada no fluxo: quem posiciona é o `ComboboxPositioner`.
 */
</script>

<template>
  <ComboboxContent
    data-slot="combobox-list"
    v-bind="forwarded"
    :class="cn('nds-combobox-list', props.class)"
  >
    <slot />
  </ComboboxContent>
</template>
