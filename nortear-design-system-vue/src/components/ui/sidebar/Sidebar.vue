<script setup lang="ts">
import type { SidebarProps } from './index'
import { cn } from '@/lib/utils'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import SheetDescription from '@/components/ui/sheet/SheetDescription.vue'
import SheetHeader from '@/components/ui/sheet/SheetHeader.vue'
import SheetTitle from '@/components/ui/sheet/SheetTitle.vue'
import { SIDEBAR_WIDTH_MOBILE, useSidebar } from './utils'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<SidebarProps>(), {
  side: 'left',
  variant: 'sidebar',
  collapsible: 'offcanvas',
})

const { isMobile, state, openMobile, setOpenMobile } = useSidebar()

// A devolução do foco ao gatilho quando a gaveta fecha NÃO é escrita aqui, e
// isso foi medido, não presumido: o primitivo desta stack adota como "gatilho"
// o elemento que estava focado no momento em que o painel monta (desde que não
// seja o `<body>`), então o `SidebarTrigger` — que o diálogo nunca vê, porque a
// gaveta abre pelo estado da sidebar — acaba registrado assim mesmo. Outras
// stacks precisam de código próprio para isto. A story `MobileOverlay` mantém a
// asserção de qualquer forma: o comportamento é contrato, não detalhe da lib.
</script>

<template>
  <div
    v-if="collapsible === 'none'"
    data-slot="sidebar"
    :class="cn('nds-sidebar-static', props.class)"
    v-bind="$attrs"
  >
    <slot />
  </div>

  <!-- A classe e os atributos de quem compõe vão para o PAINEL, não para a raiz
       do Sheet: a raiz não renderiza elemento nenhum, então tudo o que pousasse
       ali sumia em silêncio — a classe do consumidor desaparecia só em tela
       estreita. Na coluna eles pousam em `.nds-sidebar-panel`; aqui, na gaveta,
       que cumpre o mesmo papel. O `v-bind="$attrs"` vem depois do `:style` de
       propósito: assim um estilo de fora sobrescreve a medida móvel em vez de
       ser engolido por ela. -->
  <Sheet
    v-else-if="isMobile"
    :open="openMobile"
    @update:open="setOpenMobile"
  >
    <SheetContent
      data-sidebar="sidebar"
      data-slot="sidebar"
      data-mobile="true"
      :side="side"
      :class="cn('nds-sidebar-mobile', props.class)"
      :style="{
        '--sidebar-width': SIDEBAR_WIDTH_MOBILE,
      }"
      v-bind="$attrs"
    >
      <SheetHeader class="nds-sr-only">
        <SheetTitle>Sidebar</SheetTitle>
        <SheetDescription>Displays the mobile sidebar.</SheetDescription>
      </SheetHeader>
      <div class="nds-sidebar-mobile-inner">
        <slot />
      </div>
    </SheetContent>
  </Sheet>

  <div
    v-else
    class="nds-sidebar-root"
    data-slot="sidebar"
    :data-state="state"
    :data-collapsible="state === 'collapsed' ? collapsible : ''"
    :data-variant="variant"
    :data-side="side"
  >
    <!-- This is what handles the sidebar gap on desktop  -->
    <div
      data-slot="sidebar-gap"
      :class="cn('nds-sidebar-gap-inner')"
    />
    <div
      data-slot="sidebar-container"
      :data-side="side"
      :class="cn('nds-sidebar-panel', props.class)"
      v-bind="$attrs"
    >
      <div
        data-sidebar="sidebar"
        data-slot="sidebar-inner"
        class="nds-sidebar-inner"
      >
        <slot />
      </div>
    </div>
  </div>
</template>
