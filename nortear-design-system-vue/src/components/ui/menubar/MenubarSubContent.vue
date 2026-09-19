<script setup lang="ts">
import type { MenubarSubContentEmits, MenubarSubContentProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import {
  MenubarPortal,
  MenubarSubContent,
  useForwardPropsEmits,
} from 'reka-ui'
import { cn } from '@/lib/utils'
import { useSubmenuEscape } from '@/components/ui/dropdown-menu/dropdown-menu.context'
import { injectMenubarCloseChannel } from './menubar.context'
import { useMenubarTabLeaves } from './tab-leaves-menu'

defineOptions({
  inheritAttrs: false,
})

/**
 * O VÃO do subpainel — D15 do PRD do DropdownMenu, que é o da FAMÍLIA, decisão
 * da dona em 2026-09-18.
 *
 * `sideOffset: 0` encosta o subpainel no painel pai, e o `alignOffset` entrega
 * o desenho que a D15 decide: o PRIMEIRO ITEM do submenu alinha com o
 * SUB-GATILHO que o abriu, em vez de alinhar com a borda da caixa. O 8 do
 * painel de TOPO (D12) é outro número e outro assunto: ali o menu abre de uma
 * barra e pede mais respiro.
 *
 * **O número do `alignOffset` aqui é `0`, e não o `-4` da D15** — as três peças
 * de submenu desta stack saem do mesmo `MenuSubContent` da reka, e nela o `-4`
 * desfaz o alinhamento em vez de produzi-lo. A medição, o porquê e o que a
 * story afirma estão por extenso em `dropdown-menu/DropdownMenuSubContent.vue`,
 * onde foram feitos; repetir o quadro aqui é a terceira cópia que diverge.
 *
 * Até esta data esta peça não declarava nada e herdava o padrão da lib, nunca
 * medido.
 */
const props = withDefaults(
  defineProps<MenubarSubContentProps & { class?: HTMLAttributes['class'] }>(),
  {
    sideOffset: 0,
    alignOffset: 0,
  },
)
const emits = defineEmits<MenubarSubContentEmits>()

const delegatedProps = reactiveOmit(props, 'class')

const forwarded = useForwardPropsEmits(delegatedProps, emits)

// O portal tira este painel da árvore DOM do painel raiz: a tecla apertada aqui
// nunca chega ao ouvinte de lá. O mesmo ouvinte, com o mesmo destino.
// PATCH: a11y — Tab sai da barra pelo vizinho do gatilho, não pelo fim do documento (ver PATCHES.md#vue-menu-tab-leaves)
const { onKeydownCapture: onTabCapture } = useMenubarTabLeaves()

// E o Escape, no sentido oposto: aqui ele fecha SÓ o submenu e devolve o foco
// ao sub-gatilho (`useSubmenuEscape`, WAI-ARIA APG, F5), onde a lib fecharia o
// menu inteiro. O `escape-key-down` abaixo só chega quando o foco está no
// painel RAIZ com este aberto pelo ponteiro — aí a lib fecha tudo, e o motivo é
// `escape`.
const { onKeydownCapture: onEscapeCapture } = useSubmenuEscape()
const channel = injectMenubarCloseChannel()

// Um ouvinte de captura só por painel: o template não aceita dois.
function onKeydownCapture(event: KeyboardEvent) {
  onTabCapture(event)
  onEscapeCapture(event)
}
</script>

<template>
  <MenubarPortal>
    <MenubarSubContent
      data-slot="menubar-sub-content"
      v-bind="{ ...$attrs, ...forwarded }"
      :class="cn('nds-dropdown-menu-content', props.class)"
      @keydown.capture="onKeydownCapture"
      @escape-key-down="channel.note('escape')"
    >
      <slot />
    </MenubarSubContent>
  </MenubarPortal>
</template>
