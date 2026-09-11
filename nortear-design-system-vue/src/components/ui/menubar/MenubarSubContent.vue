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
const { onKeydownCapture } = useMenubarTabLeaves()
</script>

<template>
  <MenubarPortal>
    <MenubarSubContent
      data-slot="menubar-sub-content"
      v-bind="{ ...$attrs, ...forwarded }"
      :class="cn('nds-dropdown-menu-content', props.class)"
      @keydown.capture="onKeydownCapture"
    >
      <slot />
    </MenubarSubContent>
  </MenubarPortal>
</template>
