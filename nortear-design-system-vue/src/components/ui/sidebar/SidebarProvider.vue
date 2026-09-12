<script setup lang="ts">
import type { HTMLAttributes, Ref } from 'vue'
import { defaultDocument, useEventListener, useVModel } from '@vueuse/core'
import { computed, ref } from 'vue'
import { TooltipProvider } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/composables/use-mobile'
import { provideSidebarContext, SIDEBAR_COOKIE_MAX_AGE, SIDEBAR_COOKIE_NAME, SIDEBAR_KEYBOARD_SHORTCUT, SIDEBAR_MOBILE_QUERY, SIDEBAR_WIDTH, SIDEBAR_WIDTH_ICON } from './utils'

const props = withDefaults(defineProps<{
  defaultOpen?: boolean
  open?: boolean
  /**
   * A consulta de mídia que decide entre coluna e gaveta.
   *
   * Existe como prop porque o ponto de virada é do produto, não do design
   * system — e porque sem ela o caminho móvel só seria alcançável
   * redimensionando o navegador, o que nenhum teste headless faz.
   */
  mobileQuery?: string
  class?: HTMLAttributes['class']
}>(), {
  defaultOpen: !defaultDocument?.cookie.includes(`${SIDEBAR_COOKIE_NAME}=false`),
  open: undefined,
  mobileQuery: SIDEBAR_MOBILE_QUERY,
})

const emits = defineEmits<{
  'update:open': [open: boolean]
}>()

// Getter, e não o valor: trocar a consulta em tempo de execução tem de
// reavaliar o modo, sem remontar o provider.
const isMobile = useIsMobile(() => props.mobileQuery)
const openMobile = ref(false)

const open = useVModel(props, 'open', emits, {
  defaultValue: props.defaultOpen ?? false,
  passive: (props.open === undefined) as false,
}) as Ref<boolean>

function setOpen(value: boolean) {
  open.value = value // emits('update:open', value)

  // This sets the cookie to keep the sidebar state.
  document.cookie = `${SIDEBAR_COOKIE_NAME}=${open.value}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`
}

function setOpenMobile(value: boolean) {
  openMobile.value = value
}

// Helper to toggle the sidebar.
function toggleSidebar() {
  return isMobile.value ? setOpenMobile(!openMobile.value) : setOpen(!open.value)
}

useEventListener('keydown', (event: KeyboardEvent) => {
  if (event.key === SIDEBAR_KEYBOARD_SHORTCUT && (event.metaKey || event.ctrlKey)) {
    event.preventDefault()
    toggleSidebar()
  }
})

// We add a state so that we can do data-state="expanded" or "collapsed".
// This makes it easier to style the sidebar with CSS (.nds-* / data-attrs).
const state = computed(() => open.value ? 'expanded' : 'collapsed')

provideSidebarContext({
  state,
  open,
  setOpen,
  isMobile,
  openMobile,
  setOpenMobile,
  toggleSidebar,
})
</script>

<template>
  <!--
    O provedor é o da CASA, e vem SEM `delay-duration` de propósito.

    O trilho recolhido troca o rótulo de cada item por um balão, e esse balão
    tem de esperar o mesmo que todo balão do design system — 300ms, fixados
    pela dona em 2026-09-12 (PRD do tooltip, D5). O jeito de esperar o mesmo é
    não declarar valor nenhum aqui: quem guarda o número é
    `ui/tooltip/TooltipProvider.vue`, e um segundo número neste arquivo seria a
    divergência de volta, só que escrita de novo.

    As duas formas erradas, que já estiveram aqui ou perto:
      - `:delay-duration="0"` (resíduo do shadcn): balão a cada passada do
        ponteiro pela coluna de ícones;
      - o `TooltipProvider` da `reka-ui` sem prop nenhuma: cairia nos 700ms
        padrão da lib, que ninguém escolheu.
  -->
  <TooltipProvider>
    <div
      data-slot="sidebar-wrapper"
      :style="{
        '--sidebar-width': SIDEBAR_WIDTH,
        '--sidebar-width-icon': SIDEBAR_WIDTH_ICON,
      }"
      :class="cn('nds-sidebar-wrapper', props.class)"
      v-bind="$attrs"
    >
      <slot />
    </div>
  </TooltipProvider>
</template>
