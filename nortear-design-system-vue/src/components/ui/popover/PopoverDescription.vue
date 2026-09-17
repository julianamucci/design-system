<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { onBeforeUnmount, onMounted, ref, useId } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()

const id = `nds-popover-description-${useId()}`
const el = ref<HTMLElement | null>(null)
let panel: HTMLElement | null = null

// A descrição REIVINDICA o `aria-describedby` do painel.
//
// A reka não liga descrição nenhuma ao painel — não há peça `PopoverDescription`
// na lib, então nada escreve o atributo e o conteúdo compartilhado prometia, em
// três chaves e três idiomas, uma ligação que esta stack não entregava.
//
// Quem faz a ligação é a DESCRIÇÃO, e não o painel, pelo mesmo motivo do
// `PopoverTitle.vue`: quem sabe que ela existe é ela mesma, e ela monta junto
// com o painel, com o próprio elemento em mãos. O painel teria de adivinhar se
// há descrição e esperar por ela.
//
// Sem observador, ao contrário do título: ali a lib DISPUTA o `aria-labelledby`
// e o reescreve a cada re-render; aqui ninguém mais escreve `aria-describedby`,
// então reafirmar seria guardar contra um adversário que não existe.
function reivindicar(): void {
  panel = el.value?.closest<HTMLElement>('[data-slot="popover-content"]') ?? null
  if (!panel) return
  if (panel.getAttribute('aria-describedby') !== id) {
    panel.setAttribute('aria-describedby', id)
  }
}

onMounted(reivindicar)

// A referência ao painel é guardada na montagem: no desmonte o elemento já pode
// estar destacado, e `closest` devolveria `null` deixando o atributo apontando
// para um id que não existe mais — que é o que reprova em `aria-valid-attr-value`.
onBeforeUnmount(() => {
  if (panel?.getAttribute('aria-describedby') === id) {
    panel.removeAttribute('aria-describedby')
  }
  panel = null
})
</script>

<template>
  <p
    :id="id"
    ref="el"
    data-slot="popover-description"
    :class="cn('nds-popover-description', props.class)"
  >
    <slot />
  </p>
</template>
