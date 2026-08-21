<script lang="ts" setup>
import type { ToasterProps } from 'vue-sonner'

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
  XIcon,
} from 'lucide-vue-next'
import { Toaster as Sonner } from 'vue-sonner'
import { computed } from 'vue'

// A folha da lib NÃO é injetada em runtime nesta stack — o pacote a expõe como
// `vue-sonner/style.css` e espera que quem consome a importe. Sem esta linha a
// região saía sem posicionamento, sem fundo e sem sombra: um `<ol>` cru no meio
// da página, e nada na tela dizia que faltava alguma coisa.
import 'vue-sonner/style.css'

/**
 * Rótulos em português — o design system é escrito em pt-BR, e os defaults da
 * lib ("Notifications", "Close toast") chegariam à tela em inglês.
 */
const REGION_LABEL = 'Notificações'
const CLOSE_LABEL = 'Fechar notificação'

const props = defineProps<ToasterProps>()

/**
 * `toastOptions` é MESCLADO, e não substituído: passar só `classNames` não pode
 * apagar o rótulo do botão de fechar.
 */
const toastOptions = computed(() => ({
  closeButtonAriaLabel: CLOSE_LABEL,
  ...(props.toastOptions ?? {}),
}))

const containerAriaLabel = computed(() => props.containerAriaLabel ?? REGION_LABEL)
</script>

<template>
  <Sonner
    :style="{
      '--normal-bg': 'var(--popover)',
      '--normal-text': 'var(--popover-foreground)',
      '--normal-border': 'var(--border)',
      '--border-radius': 'var(--radius)',
    }"
    v-bind="props"
    :container-aria-label="containerAriaLabel"
    :toast-options="toastOptions"
  >
    <template #success-icon>
      <CircleCheckIcon class="nds-toast-icon" />
    </template>
    <template #info-icon>
      <InfoIcon class="nds-toast-icon" />
    </template>
    <template #warning-icon>
      <TriangleAlertIcon class="nds-toast-icon" />
    </template>
    <template #error-icon>
      <OctagonXIcon class="nds-toast-icon" />
    </template>
    <template #loading-icon>
      <div>
        <Loader2Icon class="nds-toast-icon nds-toast-icon-spin" />
      </div>
    </template>
    <template #close-icon>
      <XIcon class="nds-toast-icon" />
    </template>
  </Sonner>
</template>
