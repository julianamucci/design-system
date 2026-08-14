<script setup lang="ts">
import type { PrimitiveProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { Primitive } from 'reka-ui'
import { computed } from 'vue'
import { cn } from '@/lib/utils'
import { useCommand } from './index'

const props = defineProps<PrimitiveProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = reactiveOmit(props, 'class')

const { filterState } = useCommand()

const isEmpty = computed(() => !!filterState.search && filterState.filtered.count === 0)
</script>

<!--
  "Nenhum resultado" — e o ponto não é desenhar a frase, é ANUNCIÁ-LA.

  O elemento fica montado o tempo todo, com `role="status"` e `aria-live`: uma
  região viva só é lida quando o conteúdo muda DENTRO dela, então criá-la no
  instante em que a busca esvazia (o `v-if` que morava aqui) não anuncia nada
  para quem usa leitor de tela.

  O que entra e sai é o CONTEÚDO e a classe. `.nds-command-empty` traz 24px de
  `padding-block`, e mantê-la com a lista cheia deixaria um vão embaixo dos
  resultados. Sem a classe e sem conteúdo o nó continua no DOM e na árvore de
  acessibilidade, com altura zero — que é o oposto de `display: none`, e é o que
  preserva o anúncio.

  Fica FORA do `CommandList` de propósito: `role="status"` não é filho permitido
  de `role="listbox"` (axe, `aria-required-children`).
-->
<template>
  <Primitive
    data-slot="command-empty"
    v-bind="delegatedProps"
    role="status"
    aria-live="polite"
    aria-atomic="true"
    :data-empty="isEmpty ? '' : undefined"
    :class="cn(isEmpty && 'nds-command-empty', props.class)"
  >
    <slot v-if="isEmpty" />
  </Primitive>
</template>
