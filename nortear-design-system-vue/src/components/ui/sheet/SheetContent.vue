<script setup lang="ts">
import type { DialogContentEmits, DialogContentProps } from 'reka-ui'

import type { HTMLAttributes } from 'vue'
import { computed } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { XIcon } from 'lucide-vue-next'
import {
  DialogClose,
  DialogContent,
  DialogPortal,
  injectDialogRootContext,
  useForwardPropsEmits,
} from 'reka-ui'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import SheetOverlay from './SheetOverlay.vue'

interface SheetContentProps extends DialogContentProps {
  class?: HTMLAttributes['class']
  side?: 'top' | 'right' | 'bottom' | 'left'
  showCloseButton?: boolean
  /**
   * Nome acessível do botão X. Era a palavra "Fechar" escrita direto no
   * template, e essa era a única string de interface do Sheet presa a um
   * idioma: numa página em inglês ou espanhol o leitor de tela ouvia
   * português, sem que nada na chamada pudesse mudar isso.
   */
  closeLabel?: string
}

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<SheetContentProps>(), {
  side: 'right',
  showCloseButton: true,
  closeLabel: 'Fechar',
})
const emits = defineEmits<DialogContentEmits>()

const delegatedProps = reactiveOmit(props, 'class', 'side', 'showCloseButton', 'closeLabel')

const forwarded = useForwardPropsEmits(delegatedProps, emits)

// Decisão de acessibilidade do Sheet — bloco canônico no sheet.ts do Vanilla.
// Em resumo: painel modal que entra pela borda, com role="dialog",
// aria-modal="true", foco preso, foco devolvido ao gatilho no fecho, Escape e
// clique no véu fechando, rolagem da página travada, corpo rolável com papel e
// nome, e NENHUMA região viva.
//
// O mecanismo desta stack, medido em node_modules: o DialogContent escolhe
// entre DialogContentModal e DialogContentNonModal pelo modal da raiz — o
// modal liga trap-focus, chama useHideOthers (aria-hidden nos irmãos) e devolve
// o foco ao gatilho no onCloseAutoFocus; o não-modal passa trap-focus: false.
// O véu segue o mesmo interruptor: o DialogOverlay só renderiza quando a raiz
// é modal.
//
// O primitivo isola o resto do documento com `aria-hidden` e NÃO emite
// `aria-modal`. O contrato de markup do design system promete o atributo,
// então quem o emite é este wrapper — lendo do contexto da raiz para que um
// painel não-modal não o receba.
//
// Aqui morava também um `aria-label="Sheet"` de muleta, aplicado sempre que o
// consumidor não passasse `aria-labelledby` — o que é SEMPRE, porque quem liga
// o rótulo ao SheetTitle é a lib, por dentro, e não um atributo de fora. Ele
// era inerte enquanto houvesse título (aria-labelledby vence aria-label) e
// nocivo quando não houvesse: batizava o painel de "Sheet", em inglês, em vez
// de deixar o axe apontar o diálogo sem nome.
const rootContext = injectDialogRootContext()
const ariaModal = computed(() => (rootContext.modal.value ? 'true' : undefined))
</script>

<template>
  <DialogPortal>
    <SheetOverlay />
    <DialogContent
      data-slot="sheet-content"
      :data-side="side"
      :class="cn('nds-sheet-content', props.class)"
      v-bind="{ 'aria-modal': ariaModal, ...$attrs, ...forwarded }"
    >
      <slot />

      <DialogClose
        v-if="showCloseButton"
        data-slot="sheet-close"
        as-child
      >
        <Button
          variant="ghost"
          class="nds-sheet-close-position"
          size="icon-sm"
        >
          <XIcon />
          <span class="nds-sr-only">{{ props.closeLabel }}</span>
        </Button>
      </DialogClose>
    </DialogContent>
  </DialogPortal>
</template>
