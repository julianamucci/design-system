<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { onBeforeUnmount, onMounted, ref, useId } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()

const id = `nds-popover-title-${useId()}`
const el = ref<HTMLElement | null>(null)
let observer: MutationObserver | null = null

// O título REIVINDICA o nome do painel.
//
// A lib crava `aria-labelledby` do painel apontando para o GATILHO, por um
// `mergeProps` em que o valor dela vem por último — não há prop nem atributo
// que a sobreponha. O painel era anunciado com o texto do botão ("Abrir
// popover") em vez do título que ele carrega, e o conteúdo compartilhado
// promete o contrário: com título, o nome do diálogo é o título.
//
// Quem faz a correção é o título, e não o painel, porque é ele que sabe que
// existe — e monta junto com o painel, com o próprio elemento em mãos. O
// MutationObserver reafirma o valor porque cada re-render da lib reescreve o
// dela por cima.
function reivindicar(): void {
  const painel = el.value?.closest<HTMLElement>('[data-slot="popover-content"]')
  if (!painel) return
  if (painel.getAttribute('aria-labelledby') !== id) {
    painel.setAttribute('aria-labelledby', id)
  }
  // `aria-label` junto de `aria-labelledby` é ambiguidade, não redundância.
  painel.removeAttribute('aria-label')
}

onMounted(() => {
  reivindicar()
  const painel = el.value?.closest<HTMLElement>('[data-slot="popover-content"]')
  if (!painel) return
  observer = new MutationObserver(reivindicar)
  observer.observe(painel, { attributes: true, attributeFilter: ['aria-labelledby', 'aria-label'] })
})

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
})
</script>

<template>
  <!-- role="heading": era um <div> sem semântica nenhuma. O título do painel
       precisa ser anunciado como cabeçalho. Sem tag fixa porque o nível de
       cabeçalho depende da página que consome; `aria-level` declara o nível
       sem cravar a tag. -->
  <div
    :id="id"
    ref="el"
    data-slot="popover-title"
    role="heading"
    aria-level="2"
    :class="cn('nds-popover-title', props.class)"
  >
    <slot />
  </div>
</template>
