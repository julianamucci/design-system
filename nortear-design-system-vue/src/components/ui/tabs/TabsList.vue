<script setup lang="ts">
import type { TabsListProps } from 'reka-ui'
import type { ComponentPublicInstance, HTMLAttributes } from 'vue'
import type { TabsListVariants } from './index'
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { reactiveOmit, unrefElement } from '@vueuse/core'
import { TabsList } from 'reka-ui'
import { cn } from '@/lib/utils'
import { tabsListVariants } from './index'

const props = withDefaults(defineProps<TabsListProps & {
  class?: HTMLAttributes['class']
  variant?: TabsListVariants['variant']
}>(), {
  variant: 'default',
})

const delegatedProps = reactiveOmit(props, 'class', 'variant')

// ─── Guarda da aba desabilitada ───────────────────────────────────────────────
//
// A aba desabilitada continua no percurso da seta (ver `TabsTrigger.vue`), e
// para o primitivo ela é uma aba comum: o ponteiro ativa (o primitivo escuta
// `mousedown`), o Enter/Espaço ativa, e o simples FOCO ativa, porque a ativação
// é automática. Estes três caminhos precisam ser barrados de verdade —
// `pointer-events: none` na folha só resolve o ponteiro, e nada resolve o
// teclado.
//
// A guarda mora na LISTA, em fase de captura, porque essa é a única posição
// determinística: num ancestral, a captura precede sempre os ouvintes do alvo.
// No próprio botão, a ordem passaria a depender de quem registrou primeiro.
//
// `focus` não é cancelável, então `preventDefault()` não o conteria — quem
// contém é `stopPropagation()`, que impede o evento de chegar ao ouvinte do
// primitivo. O foco em si acontece: é ele que faz o leitor de tela anunciar.

const list = ref<ComponentPublicInstance | null>(null)

function abaBloqueada(target: EventTarget | null): boolean {
  return target instanceof Element && !!target.closest('[role="tab"][aria-disabled="true"]')
}

function bloquearAtivacao(e: Event): void {
  if (!abaBloqueada(e.target)) return
  e.preventDefault()
  e.stopPropagation()
}

function bloquearTecla(e: Event): void {
  const tecla = (e as KeyboardEvent).key
  // Só Enter e Espaço. As setas, Home e End seguem para o primitivo — é como a
  // aba desabilitada continua alcançável.
  if (tecla !== 'Enter' && tecla !== ' ') return
  bloquearAtivacao(e)
}

const EVENTOS: Array<[string, (e: Event) => void]> = [
  ['mousedown', bloquearAtivacao],
  ['click', bloquearAtivacao],
  ['keydown', bloquearTecla],
  ['focus', bloquearAtivacao],
]

let target: HTMLElement | null = null

onMounted(() => {
  target = unrefElement(list) as HTMLElement | null
  for (const [name, fn] of EVENTOS) target?.addEventListener(name, fn, true)
})

onBeforeUnmount(() => {
  for (const [name, fn] of EVENTOS) target?.removeEventListener(name, fn, true)
  target = null
})
</script>

<template>
  <TabsList
    ref="list"
    data-slot="tabs-list"
    :data-variant="variant"
    v-bind="delegatedProps"
    :class="cn(tabsListVariants({ variant }), props.class)"
  >
    <slot />
  </TabsList>
</template>
