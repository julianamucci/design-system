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

/**
 * O VÃO do subpainel — D15 do PRD, decisão da dona em 2026-09-18, MEDIDA nesta
 * lib no mesmo dia. Os dois números são declarados; um deles não é o da D15, e
 * a diferença é medição, não opinião.
 *
 * **O que a D15 decide** é o DESENHO: o subpainel encosta no pai (`sideOffset:
 * 0`), e o PRIMEIRO ITEM do submenu alinha com o SUB-GATILHO que o abriu, em
 * vez de alinhar com a borda da caixa. O `-4` de `alignOffset` é o MEIO que
 * entrega esse desenho onde `align="start"` encosta a BORDA do painel no topo
 * do gatilho: aí o primeiro item desce o `--spacing-1` de padding, e os `-4`
 * sobem a caixa de volta.
 *
 * **Na reka esse meio produz o contrário.** Medido em 2026-09-18 na story
 * `Compositions/WithSubmenu`, depois de `waitForAncorado` — sem a espera os
 * números são os do lugar de espera da lib, e foi assim que esta linha quase
 * nasceu errada:
 *
 *   alignOffset  topo do 1º item menos topo do sub-gatilho
 *   -4           −3,8px   (o item sobe ACIMA do gatilho)
 *    0           +0,6px   (alinhados)
 *
 * Ou seja: a reka já entrega o desenho da D15 sozinha, e o `-4` o desfaz. O que
 * vale aqui é o desenho, então o número é `0`. O `sideOffset` é `0` nos dois
 * casos — medido, a folga sai 0 com e sem a declaração.
 *
 * **Declarar um número que coincide com o da lib não é redundância**: é o que
 * torna o número NOSSO. Enquanto era herança, ninguém o tinha medido em stack
 * nenhuma — que é exatamente o que a D15 foi aberta para consertar. E a story
 * afirma o DESENHO (item alinhado com o sub-gatilho), não o número: se um bump
 * mudar o padrão da reka, quem reprova é ela.
 */
const props = withDefaults(
  defineProps<DropdownMenuSubContentProps & { class?: HTMLAttributes['class'] }>(),
  {
    sideOffset: 0,
    alignOffset: 0,
  },
)
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
