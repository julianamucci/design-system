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

const props = defineProps<MenubarSubContentProps & { class?: HTMLAttributes['class'] }>()
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
