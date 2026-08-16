<script setup lang="ts">
import type { HTMLAttributes } from 'vue'

import { PanelLeftIcon } from 'lucide-vue-next'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ROTULOS_SIDEBAR_PADRAO } from '@shared/primitives/sidebar-a11y-labels'
import { useSidebar } from './utils'

// `label` é o nome acessível: o botão carrega só um ícone, e o ícone é
// `aria-hidden`. O padrão vem do conteúdo compartilhado, em português — o
// controle principal do componente anunciava "Toggle Sidebar" até aqui.
const props = withDefaults(defineProps<{
  class?: HTMLAttributes['class']
  label?: string
}>(), {
  label: () => ROTULOS_SIDEBAR_PADRAO.alternar,
})

const { toggleSidebar } = useSidebar()
</script>

<template>
  <Button
    data-sidebar="trigger"
    data-slot="sidebar-trigger"
    variant="ghost"
    size="icon-sm"
    :class="cn('', props.class)"
    @click="toggleSidebar"
  >
    <PanelLeftIcon />
    <span class="nds-sr-only">{{ props.label }}</span>
  </Button>
</template>
