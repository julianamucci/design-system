<script setup lang="ts">
import type { MenubarContentProps, PointerDownOutsideEvent } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import {
  injectMenubarMenuContext,
  MenubarContent,
  MenubarPortal,
  useForwardProps,
} from 'reka-ui'
import { cn } from '@/lib/utils'
import { injectMenubarCloseChannel } from './menubar.context'
import { useMenubarTabLeaves } from './tab-leaves-menu'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<MenubarContentProps & { class?: HTMLAttributes['class'] }>(),
  {
    align: 'start',
    alignOffset: -4,
    sideOffset: 8,
  },
)

const delegatedProps = reactiveOmit(props, 'class')

const forwardedProps = useForwardProps(delegatedProps)

// PATCH: a11y — Tab sai da barra pelo vizinho do gatilho, não pelo fim do documento (ver PATCHES.md#vue-menu-tab-leaves)
const { onKeydownCapture } = useMenubarTabLeaves()

/**
 * O motivo do fechamento, anotado para a barra (`menubar.context.ts`): Escape no
 * painel é `escape`; o ponteiro fora dele — inclusive no PRÓPRIO gatilho, que
 * fecha o menu aberto — é `overlay`.
 *
 * O ponteiro no gatilho de OUTRO menu da barra não anota: ele troca o menu
 * aberto, e a troca já sai como `overlay` pela barra. O painel emite o
 * `pointer-down-outside` DEPOIS do gatilho ter pedido a troca, e anotar ali
 * deixaria uma anotação pendurada até o próximo fechamento — que sairia com o
 * motivo errado, digamos `overlay` num item escolhido.
 *
 * O foco que sai também não anota: o Tab anota por conta própria, e o resto é
 * foco movido por código, que é `api`.
 */
const channel = injectMenubarCloseChannel()
const menu = injectMenubarMenuContext(null)

function onPointerDownOutside(event: PointerDownOutsideEvent) {
  const target = event.target instanceof Element ? event.target : null
  const trigger = target?.closest<HTMLElement>('[data-slot="menubar-trigger"]')
  if (trigger && trigger !== menu?.triggerElement.value) return
  channel.note('overlay')
}
</script>

<template>
  <MenubarPortal>
    <MenubarContent
      data-slot="menubar-content"
      v-bind="{ ...$attrs, ...forwardedProps }"
      :class="cn('nds-dropdown-menu-content', props.class)"
      @keydown.capture="onKeydownCapture"
      @escape-key-down="channel.note('escape')"
      @pointer-down-outside="onPointerDownOutside"
    >
      <slot />
    </MenubarContent>
  </MenubarPortal>
</template>
