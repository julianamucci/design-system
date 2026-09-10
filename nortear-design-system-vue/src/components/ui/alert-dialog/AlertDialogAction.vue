<script setup lang="ts">
import type { AlertDialogActionProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import type { ButtonVariants } from '@/components/ui/button'
import { reactiveOmit } from '@vueuse/core'
import { AlertDialogAction } from 'reka-ui'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

const props = withDefaults(
  defineProps<AlertDialogActionProps & {
    class?: HTMLAttributes['class']
    variant?: ButtonVariants['variant']
    size?: ButtonVariants['size']
  }>(),
  {
    variant: 'default',
    size: 'default',
  },
)

// PATCH: bugfix — clique de quem consome antes do fechamento do primitivo (ver PATCHES.md#vue-alert-dialog-click-order)
// O clique de quem consome roda ANTES do fechamento, e não depois.
//
// O primitivo fecha no seu próprio `onClick`, e o `@click` de quem consome
// chegava depois dele, como atributo repassado. No modo controlado o pedido de
// mudança sai SÍNCRONO de dentro do fechamento — então quem consome recebia
// `update:open(false)` antes de saber que era uma confirmação, e marcar o
// motivo no clique (`dialog_close { reason: 'api' }`) virava `close-button`.
// No modo não controlado a lib adia o evento, e a ordem só dava certo por
// acaso. Declarado aqui e escutado na CAPTURA, o clique é entregue antes do
// ouvinte do primitivo no mesmo elemento, nos dois modos — que é também o que
// `props.table.onClick` promete: "o diálogo fecha depois de disparar".
const emit = defineEmits<{ click: [event: MouseEvent] }>()

const delegatedProps = reactiveOmit(props, 'class', 'variant', 'size')
</script>

<template>
  <AlertDialogAction
    data-slot="alert-dialog-action"
    v-bind="delegatedProps"
    :class="cn('', buttonVariants({ variant, size }), props.class)"
    @click.capture="emit('click', $event)"
  >
    <slot />
  </AlertDialogAction>
</template>
