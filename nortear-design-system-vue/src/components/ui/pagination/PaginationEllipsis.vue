<script setup lang="ts">
import type { PaginationEllipsisProps } from 'reka-ui'

import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { PaginationEllipsis } from 'reka-ui'
import { cn } from '@/lib/utils'

// `as` precisa de DEFAULT, não de atributo no template: `v-bind` dos props
// delegados é aplicado depois, e um `as: undefined` sobrescrevia o `as="span"`
// escrito à mão — o elemento voltava a ser o `div` do primitivo em silêncio.
const props = withDefaults(
  defineProps<PaginationEllipsisProps & { class?: HTMLAttributes['class'] }>(),
  { as: 'span' },
)

const delegatedProps = reactiveOmit(props, 'class')
</script>

<template>
  <!--
    `as="span"`: o primitivo renderiza `div` por padrão, e a faixa é uma lista de
    controles em linha — as outras stacks entregam `span`.

    `aria-hidden`: é decoração. O número que as reticências escondem já está nos
    links vizinhos. Antes daqui o elemento não era escondido E carregava um texto
    "More pages" em inglês, que o leitor de tela lia no meio da faixa.

    Conteúdo padrão: o caractere `…` (U+2026) como TEXTO, que é o que as notas de
    implementação pedem — não três pontos e não um ícone.
  -->
  <PaginationEllipsis
    aria-hidden="true"
    data-slot="pagination-ellipsis"
    v-bind="delegatedProps"
    :class="cn('nds-pagination-ellipsis', props.class)"
  >
    <slot>…</slot>
  </PaginationEllipsis>
</template>
