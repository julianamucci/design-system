<script setup lang="ts">
import type { AlertDialogCancelProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import type { ButtonVariants } from '@/components/ui/button'
import { reactiveOmit } from '@vueuse/core'
import { AlertDialogCancel } from 'reka-ui'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

const props = withDefaults(
  defineProps<AlertDialogCancelProps & {
    class?: HTMLAttributes['class']
    variant?: ButtonVariants['variant']
    size?: ButtonVariants['size']
  }>(),
  {
    variant: 'outline',
    size: 'default',
  },
)

// PATCH: bugfix — clique de quem consome antes do fechamento do primitivo (ver PATCHES.md#vue-alert-dialog-click-order)
// Mesma ordem da `AlertDialogAction`: o clique de quem consome é entregue na
// captura, antes do fechamento do primitivo — ver o comentário de lá.
const emit = defineEmits<{ click: [event: MouseEvent] }>()

const delegatedProps = reactiveOmit(props, 'class', 'variant', 'size')
</script>

<template>
  <AlertDialogCancel
    data-slot="alert-dialog-cancel"
    v-bind="delegatedProps"
    :class="cn( '', buttonVariants({ variant, size }), props.class, )"
    @click.capture="emit('click', $event)"
  >
    <slot />
  </AlertDialogCancel>
</template>
