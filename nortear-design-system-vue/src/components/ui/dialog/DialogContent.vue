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
import DialogOverlay from './DialogOverlay.vue'

defineOptions({
  inheritAttrs: false,
})

/**
 * `closeLabel` é o nome acessível do X do canto. Vai como texto dentro de um
 * `<span class="nds-sr-only">` e não como `aria-label`: texto real sobrevive à
 * tradução automática da página, que ignora atributo. Existe porque o rótulo
 * estava CRAVADO em pt-BR aqui dentro, e o padrão o mantém para todo call site
 * que já existia.
 */
const props = withDefaults(defineProps<DialogContentProps & { class?: HTMLAttributes['class'], showCloseButton?: boolean, closeLabel?: string }>(), {
  showCloseButton: true,
  closeLabel: 'Fechar',
})
const emits = defineEmits<DialogContentEmits>()

// `showCloseButton` e `closeLabel` são deste wrapper, não do primitivo: sem
// tirá-los daqui o `v-bind` os despeja no elemento como atributos soltos
// (`showclosebutton="true"`, `closelabel="Fechar"`), que não significam nada
// para ninguém que lê o DOM.
const delegatedProps = reactiveOmit(props, 'class', 'showCloseButton', 'closeLabel')

const forwarded = useForwardPropsEmits(delegatedProps, emits)

// O primitivo desta stack isola o resto do documento com `aria-hidden` e NÃO
// emite `aria-modal` (conferido em node_modules). O contrato de markup do
// design system promete o atributo, então quem o emite é este wrapper — lendo
// do contexto da raiz para que um diálogo não-modal não o receba.
const rootContext = injectDialogRootContext()
const ariaModal = computed(() => (rootContext.modal.value ? 'true' : undefined))
</script>

<template>
  <DialogPortal>
    <DialogOverlay />
    <DialogContent
      data-slot="dialog-content"
      v-bind="{ 'aria-modal': ariaModal, 'aria-label': $attrs['aria-labelledby'] ? undefined : 'Dialog', ...$attrs, ...forwarded }"
      :class="cn('nds-dialog-content', props.class)"
    >
      <slot />

      <DialogClose
        v-if="showCloseButton"
        data-slot="dialog-close"
        as-child
      >
        <Button
          variant="ghost"
          class="nds-dialog-close-position"
          size="icon-sm"
        >
          <XIcon />
          <span class="nds-sr-only">{{ closeLabel }}</span>
        </Button>
      </DialogClose>
    </DialogContent>
  </DialogPortal>
</template>
