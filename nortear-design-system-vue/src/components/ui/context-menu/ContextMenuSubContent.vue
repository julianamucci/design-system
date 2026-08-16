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
 */
const props = defineProps<ContextMenuSubContentProps & { class?: HTMLAttributes['class'] }>()
const emits = defineEmits<ContextMenuSubContentEmits>()

const delegatedProps = reactiveOmit(props, 'class')

const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <ContextMenuPortal>
    <ContextMenuSubContent
      data-slot="context-menu-sub-content"
      v-bind="forwarded"
      :class="cn('nds-dropdown-menu-content', props.class)"
    >
      <slot />
    </ContextMenuSubContent>
  </ContextMenuPortal>
</template>
