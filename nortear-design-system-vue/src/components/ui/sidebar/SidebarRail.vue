<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'
import { ROTULOS_SIDEBAR_PADRAO } from '@shared/primitives/sidebar-a11y-labels'
import { useSidebar } from './utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()

const tituloPadrao = ROTULOS_SIDEBAR_PADRAO.alternar

const { toggleSidebar } = useSidebar()
</script>

<template>
  <!--
    Faixa clicável na borda do painel.

    tabindex -1 de propósito: ela faz o mesmo que o gatilho, que já está na
    ordem de tabulação — duas paradas de teclado para uma ação só é ruído para
    quem navega sem mouse. O aria-hidden completa o par: sem ele, o leitor de
    tela lista dois botões com o mesmo nome para a mesma ação, e um deles nem
    recebe foco. O title fica: é a dica de ponteiro, para quem a faixa existe —
    e vem do conteúdo compartilhado, em português, com o mesmo texto do gatilho,
    porque a ação é a mesma. Um title de quem compõe ainda ganha, pela queda de
    atributos.
  -->
  <button
    data-sidebar="rail"
    data-slot="sidebar-rail"
    aria-hidden="true"
    :tabindex="-1"
    :title="tituloPadrao"
    :class="cn('nds-sidebar-rail', props.class)"
    @click="toggleSidebar"
  >
    <slot />
  </button>
</template>
