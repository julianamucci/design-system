<script setup lang="ts">
import type { ContextMenuSubContentEmits, ContextMenuSubContentProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import {
  ContextMenuPortal,
  ContextMenuSubContent,
  useForwardPropsEmits,
} from 'reka-ui'
import { cn } from '@/lib/utils'
import { useSubmenuEscape } from '@/components/ui/dropdown-menu/dropdown-menu.context'
import { useTabCloses } from './context-menu.context'

/**
 * Duas correções moram aqui, e as duas eram invisíveis em teste até esta passada.
 *
 * 1. **A classe do painel.** O `class` saía como `cn('', props.class)` — o
 *    submenu renderizava sem fundo, sem borda e sem sombra, flutuando sobre a
 *    página como texto solto. As outras stacks reusam o painel do menu raiz.
 *
 * 2. **O portal.** Sem ele o painel do submenu nasce DENTRO do painel do menu
 *    raiz. O raiz tem `overflow-y: auto`, então ele passava a rolar, e o axe
 *    acusava `scrollable-region-focusable` — uma região rolável cujos itens têm
 *    `tabindex="-1"`. O sintoma era um aviso de acessibilidade; a causa era de
 *    layout.
 *
 * E o Tab: o portal tira este painel da árvore DOM do raiz, então a tecla
 * apertada aqui nunca chega ao ouvinte de lá — e a lib também a prende aqui.
 * O mesmo ouvinte, com o mesmo destino: fecha o menu INTEIRO e segue a página.
 *
 * E o Escape, no sentido oposto: aqui ele fecha SÓ o submenu e devolve o foco
 * ao sub-gatilho (`useSubmenuEscape`, WAI-ARIA APG), onde a lib fecharia tudo.
 * É o MESMO ouvinte do submenu do DropdownMenu e do Menubar — até 2026-09-11
 * este membro tinha uma cópia própria. O `escape-key-down` abaixo só chega
 * quando o foco está no painel RAIZ com este aberto pelo ponteiro — aí a lib
 * fecha tudo, e o motivo é `escape`. O clique fora quem anota é o painel raiz:
 * para o submenu, um clique no painel raiz também é "fora", e anotá-lo daqui
 * deixaria o motivo errado pendurado.
 *
 * O `$attrs` vai ao painel, e não ao portal: com a herança automática um
 * `class`, um `id` ou um `data-*` de quem consome caía no `ContextMenuPortal`,
 * que não renderiza elemento, e sumia sem aviso — o painel raiz e os submenus
 * dos outros dois membros já repassavam.
 */
defineOptions({
  inheritAttrs: false,
})

const props = defineProps<ContextMenuSubContentProps & { class?: HTMLAttributes['class'] }>()
const emits = defineEmits<ContextMenuSubContentEmits>()

const delegatedProps = reactiveOmit(props, 'class')

const forwarded = useForwardPropsEmits(delegatedProps, emits)

// PATCH: a11y — a reka prende o Tab no modo modal; aqui ele fecha e segue a página (ver PATCHES.md#vue-context-menu-tab-closes)
const { channel, onKeydownCapture: onTabCapture } = useTabCloses()
// PATCH: a11y — a reka fecha o menu inteiro no Escape do submenu; aqui fecha só o submenu (ver PATCHES.md#vue-menu-submenu-escape)
const { onKeydownCapture: onEscapeCapture } = useSubmenuEscape()

// Um ouvinte de captura só por painel: o template não aceita dois.
function onKeydownCapture(event: KeyboardEvent) {
  onTabCapture(event)
  onEscapeCapture(event)
}
</script>

<template>
  <ContextMenuPortal>
    <ContextMenuSubContent
      data-slot="context-menu-sub-content"
      v-bind="{ ...$attrs, ...forwarded }"
      :class="cn('nds-dropdown-menu-content', props.class)"
      @keydown.capture="onKeydownCapture"
      @escape-key-down="channel.note('escape')"
    >
      <slot />
    </ContextMenuSubContent>
  </ContextMenuPortal>
</template>
