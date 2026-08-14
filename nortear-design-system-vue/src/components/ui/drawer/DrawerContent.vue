<script lang="ts" setup>
import type { DialogContentEmits, DialogContentProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { useForwardPropsEmits } from 'reka-ui'
import { DrawerContent, DrawerPortal } from 'vaul-vue'
import { cn } from '@/lib/utils'
import DrawerOverlay from './DrawerOverlay.vue'
import { useDrawerModal } from './context'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<DialogContentProps & { class?: HTMLAttributes['class'] }>()
const emits = defineEmits<DialogContentEmits>()

const forwarded = useForwardPropsEmits(props, emits)

/**
 * `aria-modal` acompanha o modo REAL da raiz.
 *
 * O primitivo desta stack não emite o atributo, então ele é escrito aqui. Fixo
 * em `"true"` ele mentia no modo não-modal: o leitor de tela esconde tudo o que
 * está fora de um diálogo com `aria-modal`, e num drawer não-modal o resto da
 * página continua clicável e legível.
 *
 * O nome acessível NÃO é escrito aqui. Havia um `aria-label="Drawer"` de
 * reserva, em inglês, e `aria-label` vence `aria-labelledby` no cálculo do nome
 * — o painel se anunciava "Drawer" em vez do título que quem compõe escreveu.
 * O nome sai do DrawerTitle, pelo `aria-labelledby` que o primitivo liga ao id
 * real dele.
 */
const modal = useDrawerModal()
</script>

<template>
  <DrawerPortal>
    <DrawerOverlay />
    <DrawerContent
      data-slot="drawer-content"
      v-bind="{ 'aria-modal': modal ? 'true' : undefined, ...$attrs, ...forwarded }"
      :class="cn('nds-drawer-content', props.class)"
    >
      <div class="nds-drawer-handle" aria-hidden="true" />
      <slot />
    </DrawerContent>
  </DrawerPortal>
</template>
