<script setup lang="ts">
import type { PrimitiveProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import type { BadgeVariants } from './index'
import { computed } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { Primitive } from 'reka-ui'
import { cn } from '@/lib/utils'
import { badgeVariants } from './index'

const props = defineProps<PrimitiveProps & {
  variant?: BadgeVariants['variant']
  class?: HTMLAttributes['class']
}>()

// `as` sai do delegate: o `Primitive` do reka o lê da própria prop, e deixá-lo
// no v-bind reinjetava `as: undefined` DEPOIS do nosso default — apagando-o.
const delegatedProps = reactiveOmit(props, 'class', 'as')

/**
 * `<span>` e não o `<div>` que o `Primitive` do reka renderiza por padrão.
 *
 * O badge é etiqueta INLINE: mora dentro de frase, de título e de célula de
 * tabela. Um elemento de bloco ali quebra o fluxo do texto, e `<div>` dentro de
 * `<p>` é aninhamento inválido — o navegador fecha o parágrafo antes dele. É o
 * que o docblock do `nds/badge.css` desenha e o que as outras quatro stacks
 * renderizam; medido pela sonda, esta era a única com a raiz em `div`.
 *
 * Continua sobrescritível: quem consome passa `as` e ele vence o default.
 */
const tag = computed(() => props.as ?? 'span')
</script>

<template>
  <Primitive
    :as="tag"
    data-slot="badge"
    :data-variant="variant"
    :class="cn(badgeVariants({ variant }), props.class)"
    v-bind="delegatedProps"
  >
    <slot />
  </Primitive>
</template>
