<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { AlertVariants } from './index'
import { ref } from 'vue'
import { X } from 'lucide-vue-next'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { alertVariants } from './index'

const props = withDefaults(defineProps<{
  class?: HTMLAttributes['class']
  variant?: AlertVariants['variant']
  /** Renderiza o botão de fechar no canto superior direito. */
  dismissible?: boolean
  /** Rótulo acessível do botão de fechar. */
  dismissLabel?: string
}>(), {
  dismissible: false,
  dismissLabel: 'Fechar alerta',
})

const emit = defineEmits<{
  /** Disparado uma única vez, quando o usuário aciona o botão de fechar. */
  dismiss: []
}>()

const visible = ref(true)

function handleDismiss() {
  visible.value = false
  emit('dismiss')
}
</script>

<template>
  <div
    v-if="visible"
    data-slot="alert"
    :class="cn(alertVariants({ variant }), props.class)"
    role="alert"
  >
    <slot />
    <Button
      v-if="props.dismissible"
      variant="ghost"
      size="icon-sm"
      class="nds-alert-dismiss"
      type="button"
      :aria-label="props.dismissLabel"
      data-slot="alert-dismiss"
      @click="handleDismiss"
    >
      <X
        class="nds-icon"
        aria-hidden="true"
      />
    </Button>
  </div>
</template>
