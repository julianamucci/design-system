<script setup lang="ts">
import type { AlertDialogDescriptionProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { inject } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import {
  AlertDialogDescription,
} from 'reka-ui'
import { cn } from '@/lib/utils'
import { ALERT_DIALOG_DESCRICAO } from './alert-dialog.context'

const props = defineProps<AlertDialogDescriptionProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = reactiveOmit(props, 'class')

// Avisa o painel de que existe descrição: é isso que faz o `aria-describedby`
// ser declarado. Sem registro o painel omite o atributo em vez de referenciar um
// id ausente. O `null` de fallback cobre o uso fora de um AlertDialogContent.
inject(ALERT_DIALOG_DESCRICAO, null)?.registrar()
</script>

<template>
  <AlertDialogDescription
    data-slot="alert-dialog-description"
    v-bind="delegatedProps"
    :class="cn('nds-alert-dialog-description', props.class)"
  >
    <slot />
  </AlertDialogDescription>
</template>
