<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'
import { useSidebar } from './utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()

const { toggleSidebar } = useSidebar()
</script>

<template>
  <!--
    Faixa clicável na borda do painel.

    tabindex -1 de propósito: ela faz o mesmo que o gatilho, que já está na
    ordem de tabulação — duas paradas de teclado para uma ação só é ruído para
    quem navega sem mouse. O aria-hidden completa o par: sem ele, o leitor de
    tela lista dois botões com o mesmo nome para a mesma ação, e um deles nem
    recebe foco. O title fica: é a dica de ponteiro, para quem a faixa existe.
  -->
  <button
    data-sidebar="rail"
    data-slot="sidebar-rail"
    aria-hidden="true"
    :tabindex="-1"
    title="Toggle Sidebar"
    :class="cn('nds-sidebar-rail', props.class)"
    @click="toggleSidebar"
  >
    <slot />
  </button>
</template>
