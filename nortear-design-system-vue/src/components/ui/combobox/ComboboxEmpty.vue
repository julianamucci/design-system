<script setup lang="ts">
import type { PrimitiveProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { Primitive, injectComboboxRootContext } from 'reka-ui'
import { computed } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<PrimitiveProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = reactiveOmit(props, 'class')

const rootContext = injectComboboxRootContext()

const isEmpty = computed(() =>
  rootContext.ignoreFilter.value
    ? rootContext.allItems.value.size === 0
    : rootContext.filterState.value.count === 0,
)

/*
 * O ponto não é desenhar a frase, é ANUNCIÁ-LA. Uma região viva só é lida
 * quando o conteúdo muda DENTRO dela, então criar o elemento no instante em que
 * a busca esvazia não anuncia nada. O nó fica montado enquanto a caixa estiver
 * aberta, e o que entra e sai é o CONTEÚDO — e a classe junto, porque
 * `.nds-combobox-empty` traz 24px de `padding-block` que deixariam um vão sob a
 * lista cheia.
 *
 * Fica FORA da lista de propósito: `role="status"` não é filho permitido de
 * `role="listbox"`.
 */
</script>

<template>
  <Primitive
    v-bind="delegatedProps"
    data-slot="combobox-empty"
    role="status"
    aria-live="polite"
    aria-atomic="true"
    :data-empty="isEmpty ? '' : undefined"
    :class="cn(isEmpty && 'nds-combobox-empty', props.class)"
  >
    <slot v-if="isEmpty" />
  </Primitive>
</template>
