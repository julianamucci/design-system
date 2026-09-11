<script setup lang="ts">
import type { DropdownMenuSubContentEmits, DropdownMenuSubContentProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import {
  DropdownMenuPortal,
  DropdownMenuSubContent,
  useForwardPropsEmits,
} from 'reka-ui'
import { cn } from '@/lib/utils'
import { useDropdownMenuTabLeaves } from './tab-leaves-menu'

/**
 * Duas correções moram aqui — as mesmas que o submenu da barra de menus e o do
 * menu de contexto já tinham recebido, e que este ficou sem.
 *
 * 1. **A classe do painel.** O `class` saía como `cn('', props.class)` — o
 *    submenu renderizava sem fundo, sem borda e sem sombra. As outras stacks
 *    reusam o painel do menu raiz.
 *
 * 2. **O portal.** Sem ele o painel do submenu nasce DENTRO do painel do menu
 *    raiz, que tem `overflow-y: auto`: o raiz passava a rolar, e o axe acusava
 *    `scrollable-region-focusable` — uma região rolável cujos itens têm
 *    `tabindex="-1"`. A story `WithSubmenu` desligava a regra atribuindo a
 *    rolagem a um recálculo de altura da lib; a causa era de layout, e com o
 *    portal a exceção saiu.
 */
defineOptions({
  inheritAttrs: false,
})

const props = defineProps<DropdownMenuSubContentProps & { class?: HTMLAttributes['class'] }>()
const emits = defineEmits<DropdownMenuSubContentEmits>()

const delegatedProps = reactiveOmit(props, 'class')

const forwarded = useForwardPropsEmits(delegatedProps, emits)

// E o Tab: o portal tira este painel da árvore DOM do raiz, então a tecla
// apertada aqui nunca chega ao ouvinte de lá — e a lib também a prende aqui. O
// mesmo ouvinte, com o mesmo destino; quem aplica o foco é o painel raiz.
// PATCH: a11y — a reka prende o Tab no menu modal (ver PATCHES.md#vue-menu-tab-leaves)
const { onKeydownCapture } = useDropdownMenuTabLeaves()
</script>

<template>
  <DropdownMenuPortal>
    <DropdownMenuSubContent
      data-slot="dropdown-menu-sub-content"
      v-bind="{ ...$attrs, ...forwarded }"
      :class="cn('nds-dropdown-menu-content', props.class)"
      @keydown.capture="onKeydownCapture"
    >
      <slot />
    </DropdownMenuSubContent>
  </DropdownMenuPortal>
</template>
