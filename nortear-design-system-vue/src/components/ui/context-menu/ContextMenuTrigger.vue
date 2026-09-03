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
    Acessibilidade — versão curta. Bloco canônico das cinco stacks: cabeçalho de
    `context-menu.ts` no Vanilla. Do popup para dentro vale o contrato do
    DropdownMenu inteiro, porque aqui as peças SÃO as de `Menu/*` do reka-ui. O
    que diverge é a abertura:

    1. O gatilho NÃO se anuncia. `ContextMenu/ContextMenuTrigger` renderiza um
       `span` e os únicos atributos que ele escreve são `data-state` e
       `data-disabled` — nada de `aria-haspopup` nem `aria-expanded`, ao
       contrário do gatilho do DropdownMenu, que é um botão e carrega os dois.
       É escolha das quatro libs e está certa: `aria-haspopup` não vale em
       `generic`, o papel implícito deste `span`. O preço está pago por escrito
       no conteúdo compartilhado (`accessibility.warning`, `notes.tip5`).
    2. `tabindex="0"` é REQUISITO, não enfeite: a tecla Menu e Shift+F10
       disparam `contextmenu` no elemento FOCADO — sem parada de tabulação o
       menu não existe para quem não usa mouse, e é esse caminho que
       `accessibility.keyboard` documenta.
    3. É também para ele que a lib devolve o foco ao fechar. Num `span` sem
       `tabindex` esse `focus()` é no-op e o foco cai no `<body>` — medido em
       sonda, contra o que `testes.functional.item2` promete.
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
