<script setup lang="ts">
import type { AlertDialogContentEmits, AlertDialogContentProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { computed, onScopeDispose, provide, ref, useAttrs } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import {
  AlertDialogContent,
  AlertDialogOverlay,
  AlertDialogPortal,
  useForwardPropsEmits,
} from 'reka-ui'
import { cn } from '@/lib/utils'
import { ALERT_DIALOG_DESCRIPTION } from './alert-dialog.context'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<AlertDialogContentProps & {
  class?: HTMLAttributes['class']
}>()
const emits = defineEmits<AlertDialogContentEmits>()

const delegatedProps = reactiveOmit(props, 'class')

const forwarded = useForwardPropsEmits(delegatedProps, emits)

// PATCH: a11y — nome acessível de fallback quando o consumidor não renderiza
// AlertDialogTitle (ver PATCHES.md#vue-alert-dialog-fallback-label)
// O Title é obrigatório e já alimenta o aria-labelledby, então isto só entra em
// composição fora do contrato — por isso o ramo não tem story.
const attrs = useAttrs()
/* v8 ignore next */
const fallbackLabel = computed(() => (attrs['aria-labelledby'] ? undefined : 'AlertDialog'))

// A descrição é opcional. O primitivo desta stack, porém, gera o id da descrição
// sempre e liga `aria-describedby` a ele mesmo quando ninguém a renderiza — o
// painel apontaria para um id ausente, que o axe reprova em
// `aria-valid-attr-value`. Ver `alert-dialog.context.ts`.
//
// `$attrs` vence a ligação interna no `mergeProps` do primitivo, então declarar o
// atributo como indefinido aqui é o que o apaga. Com descrição registrada a chave
// nem entra no objeto, e a ligação da lib segue valendo.
const descricoes = ref(0)
provide(ALERT_DIALOG_DESCRIPTION, {
  registrar() {
    descricoes.value += 1
    onScopeDispose(() => { descricoes.value -= 1 })
  },
})
const noDescription = computed(() =>
  descricoes.value === 0 ? { 'aria-describedby': undefined } : {},
)
</script>

<template>
  <!--
    `aria-modal` sai deste wrapper: o primitivo desta stack isola o resto do
    documento com `aria-hidden` e não emite o atributo (conferido em
    node_modules), enquanto o contrato de markup do design system o promete.
    Incondicional de propósito — a raiz do alert dialog não expõe `modal`, ela
    é sempre modal por definição do papel.
  -->
  <AlertDialogPortal>
    <AlertDialogOverlay
      data-slot="alert-dialog-overlay"
      class="nds-alert-dialog-overlay"
    />
    <AlertDialogContent
      data-slot="alert-dialog-content"
      v-bind="{ 'aria-modal': 'true', 'aria-label': fallbackLabel, ...noDescription, ...$attrs, ...forwarded }"
      :class="cn( 'nds-alert-dialog-content', props.class, )"
    >
      <slot />
    </AlertDialogContent>
  </AlertDialogPortal>
</template>
