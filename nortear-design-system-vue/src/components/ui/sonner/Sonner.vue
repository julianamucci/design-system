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

/**
 * A posição padrão do projeto é `top-right` — decisão da dona, 2026-09-13.
 *
 * A lib nasce em `bottom-right`, e até aqui o padrão só existia como literal em
 * cada story e na docs page: quem montasse `<Toaster />` nu recebia o canto de
 * baixo. O padrão é DO COMPONENTE, então mora aqui, uma vez, e é o que faz a
 * ponte para a lib sem que quem consome precise declará-lo.
 */
const position = computed<ToasterProps['position']>(() => props.position ?? 'top-right')
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
    :position="position"
    :container-aria-label="containerAriaLabel"
    :toast-options="toastOptions"
  >
    <template #success-icon>
      <CircleCheckIcon class="nds-sonner-icon" />
    </template>
    <template #info-icon>
      <InfoIcon class="nds-sonner-icon" />
    </template>
    <template #warning-icon>
      <TriangleAlertIcon class="nds-sonner-icon" />
    </template>
    <template #error-icon>
      <OctagonXIcon class="nds-sonner-icon" />
    </template>
    <template #loading-icon>
      <div>
        <Loader2Icon class="nds-sonner-icon nds-sonner-icon-spin" />
      </div>
    </template>
    <template #close-icon>
      <XIcon class="nds-sonner-icon" />
    </template>
  </Sonner>
</template>
