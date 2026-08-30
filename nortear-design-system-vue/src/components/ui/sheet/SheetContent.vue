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

// O primitivo desta stack isola o resto do documento com `aria-hidden` e NÃO
// emite `aria-modal` (conferido em node_modules). O contrato de markup do
// design system promete o atributo, então quem o emite é este wrapper — lendo
// do contexto da raiz para que um painel não-modal não o receba.
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
