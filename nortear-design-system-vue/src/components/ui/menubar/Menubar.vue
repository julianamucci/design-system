<script setup lang="ts">
import type { MenubarRootProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import {
  MenubarRoot,
  useForwardProps,
} from 'reka-ui'
import { provide, watch } from 'vue'
import { cn } from '@/lib/utils'
import { closeReasonFor, MENUBAR_CLOSE, type MenubarCloseReason } from './menubar.context'

/**
 * `loop` nasce LIGADO: a seta lateral no último gatilho volta ao primeiro, e a
 * do primeiro vai ao último.
 *
 * É o que o conteúdo compartilhado promete (`props.table.loop.default`, F2), o
 * que as outras stacks fazem e o que o painel Code desta ensina — o
 * `menubar.source.ts` só escreve `loop` quando ele é DESLIGADO. A reka nasce com
 * ele desligado (`MenubarRoot`, `loop: false`), e a barra montada sem a prop
 * parava na ponta enquanto a documentação dizia que dava a volta.
 */
// PATCH: a11y — a reka nasce com `loop` desligado; a barra dá a volta por padrão, como o conteúdo promete (ver PATCHES.md#vue-menubar-loop-default)
const props = withDefaults(defineProps<MenubarRootProps & { class?: HTMLAttributes['class'] }>(), {
  loop: true,
})

/**
 * `update:modelValue` ganha o MOTIVO como segundo argumento quando um menu
 * fecha — de um menu para nenhum, ou de um menu para o vizinho. É a forma do
 * `update:open` do DropdownMenu e do ContextMenu desta stack, adaptada ao valor
 * da barra: quem consome sabe qual menu fechou pelo valor que tinha antes, e
 * por que fechou por este argumento. O `menubar_close` precisa dele; sem ele a
 * docs page mandaria o fechamento sem `reason` ou inventaria um.
 */
const emits = defineEmits<{
  'update:modelValue': [value: string, reason?: MenubarCloseReason]
}>()

const delegatedProps = reactiveOmit(props, 'class')

// Só as props: `update:modelValue` quem emite é `handleValueChange`, com o
// motivo. Repassá-lo também faria o consumidor receber cada mudança duas vezes.
const forwarded = useForwardProps(delegatedProps)

let current = props.modelValue ?? props.defaultValue ?? ''
// Quem controla por `v-model` pode mudar o valor por fora; o anterior tem de
// acompanhar, senão o próximo fechamento compararia com um valor velho.
watch(() => props.modelValue, (value) => {
  if (value !== undefined) current = value
})

let pendingReason: MenubarCloseReason | null = null

/**
 * A lib tipa o valor como `boolean` (`MenubarRootEmits` da reka 2.10), mas o
 * que chega é o `value` do menu aberto, ou `''` com a barra fechada — por isso
 * o parâmetro aceita os dois e só o texto passa adiante.
 */
function handleValueChange(value: string | boolean) {
  const next = typeof value === 'string' ? value : ''
  const reason = closeReasonFor(current, next, pendingReason)
  current = next
  // Limpa sempre: uma anotação que não resultou em fechamento não pode vazar
  // para o próximo.
  pendingReason = null
  emits('update:modelValue', next, reason)
}

// O painel vive em portal e não é descendente de template desta raiz, mas o
// `provide` alcança porque a árvore de COMPONENTES continua a mesma.
provide(MENUBAR_CLOSE, {
  note: (reason) => { pendingReason = reason },
})
</script>

<template>
  <MenubarRoot
    v-slot="slotProps"
    data-slot="menubar"
    v-bind="forwarded"
    :class="cn('nds-menubar', props.class)"
    @update:model-value="handleValueChange"
  >
    <slot v-bind="slotProps" />
  </MenubarRoot>
</template>
