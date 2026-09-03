<script setup lang="ts">
/**
 * ROTA B — o overlay é quem rola.
 *
 * O painel entra no FLUXO do overlay, e o overlay vira a área de rolagem: o
 * cabeçalho sobe junto com o conteúdo e sai da tela. Serve para conteúdo que se
 * lê de ponta a ponta (um contrato, um artigo), em que fixar o cabeçalho rouba
 * altura útil. As classes são `.nds-dialog-overlay-scroll` e
 * `.nds-dialog-content-scroll`, o par que `dialog.css` declara para as cinco
 * stacks, e o painel é filho do overlay porque rolagem de um elemento só
 * alcança o que está dentro dele.
 *
 * ROTA A é o `DialogContent` de sempre: o painel fica parado e centralizado, o
 * cabeçalho e o rodapé não saem da tela, e quem rola é o corpo — quem compõe
 * pendura `.nds-dialog-body-scroll` nele, com `tabindex="0"`, `role="group"` e
 * nome.
 *
 * A FORMA da rota B diverge por stack, e isso é divergência de API de
 * framework: não há fonte de verdade e não se "alinha". Aqui é um COMPONENTE
 * próprio, porque a composição do overlay com o painel é o que muda e o
 * `DialogContent` desta stack já monta os dois.
 */
import type { DialogContentEmits, DialogContentProps } from 'reka-ui'

import type { HTMLAttributes } from 'vue'
import { computed } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { XIcon } from 'lucide-vue-next'
import {
  DialogClose,
  DialogContent,
  DialogOverlay,
  DialogPortal,
  injectDialogRootContext,
  useForwardPropsEmits,
} from 'reka-ui'
import { cn } from '@/lib/utils'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<DialogContentProps & { class?: HTMLAttributes['class'] }>()
const emits = defineEmits<DialogContentEmits>()

const delegatedProps = reactiveOmit(props, 'class')

const forwarded = useForwardPropsEmits(delegatedProps, emits)

// Mesmo motivo do DialogContent: o primitivo desta stack não emite
// `aria-modal`, e o contrato de markup do design system promete o atributo.
const rootContext = injectDialogRootContext()
const ariaModal = computed(() => (rootContext.modal.value ? 'true' : undefined))
</script>

<template>
  <DialogPortal>
    <!--
      Os `data-slot` são o contrato de markup que as cinco stacks compartilham:
      sem eles esta variante ficava invisível para toda consulta que procura o
      painel, o overlay ou o botão de fechar — inclusive as dos testes.
    -->
    <DialogOverlay
      data-slot="dialog-overlay"
      class="nds-dialog-overlay nds-dialog-overlay-scroll"
    >
      <DialogContent
        data-slot="dialog-content"
        :class="cn( 'nds-dialog-content nds-dialog-content-scroll', props.class, )"
        v-bind="{ 'aria-modal': ariaModal, ...$attrs, ...forwarded }"
        @pointer-down-outside="(event) => {
          const originalEvent = event.detail.originalEvent;
          const target = originalEvent.target as HTMLElement;
          if (originalEvent.offsetX > target.clientWidth || originalEvent.offsetY > target.clientHeight) {
            event.preventDefault();
          }
        }"
      >
        <slot />

        <DialogClose
          data-slot="dialog-close"
          class="nds-dialog-close"
        >
          <XIcon />
          <span class="nds-sr-only">Fechar</span>
        </DialogClose>
      </DialogContent>
    </DialogOverlay>
  </DialogPortal>
</template>
