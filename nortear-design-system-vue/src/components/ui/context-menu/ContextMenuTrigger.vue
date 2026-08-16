<script setup lang="ts">
import type { ContextMenuTriggerProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { ContextMenuTrigger, useForwardProps } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<ContextMenuTriggerProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = reactiveOmit(props, 'class')
const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <!--
    `tabindex="0"` não é enfeite (mesma nota do stack Angular):
    1. a tecla Menu e Shift+F10 disparam `contextmenu` no elemento FOCADO — sem
       foco possível, quem não usa mouse nunca abre o menu, e o conteúdo
       compartilhado documenta esse caminho em `accessibility.keyboard`;
    2. ao fechar, a lib devolve o foco ao gatilho. Numa `<span>` sem `tabindex`
       esse `focus()` é no-op e o foco cai no `<body>` — medido em sonda antes
       desta correção, contra o que `testes.functional.item2` promete.
  -->
  <ContextMenuTrigger
    data-slot="context-menu-trigger"
    tabindex="0"
    v-bind="forwardedProps"
    :class="cn('nds-context-menu-trigger', props.class)"
  >
    <slot />
  </ContextMenuTrigger>
</template>
