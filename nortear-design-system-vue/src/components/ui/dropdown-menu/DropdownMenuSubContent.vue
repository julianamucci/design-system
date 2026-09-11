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
import { injectDropdownMenuCloseChannel, useSubmenuEscape } from './dropdown-menu.context'
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
const { onKeydownCapture: onTabCapture } = useDropdownMenuTabLeaves()

// E o Escape, no sentido oposto: aqui ele fecha SÓ o submenu e devolve o foco
// ao sub-gatilho (`useSubmenuEscape`, WAI-ARIA APG, F12), onde a lib fecharia
// tudo. O `escape-key-down` abaixo só chega quando o foco está no painel RAIZ
// com este aberto pelo ponteiro — aí a lib fecha tudo, e o motivo é `escape`.
// O clique fora quem anota é o painel raiz: para o submenu, um clique no painel
// raiz também é "fora", e anotá-lo daqui deixaria o motivo errado pendurado.
const { onKeydownCapture: onEscapeCapture } = useSubmenuEscape()
const channel = injectDropdownMenuCloseChannel()

// Um ouvinte de captura só por painel: o template não aceita dois.
function onKeydownCapture(event: KeyboardEvent) {
  onTabCapture(event)
  onEscapeCapture(event)
}
</script>

<template>
  <DropdownMenuPortal>
    <DropdownMenuSubContent
      data-slot="dropdown-menu-sub-content"
      v-bind="{ ...$attrs, ...forwarded }"
      :class="cn('nds-dropdown-menu-content', props.class)"
      @keydown.capture="onKeydownCapture"
      @escape-key-down="channel.note('escape')"
    >
      <slot />
    </DropdownMenuSubContent>
  </DropdownMenuPortal>
</template>
