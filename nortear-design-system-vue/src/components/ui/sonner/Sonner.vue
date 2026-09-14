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
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

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

/**
 * Sem atalho por padrão: a lib concatena o atalho ao nome da região
 * ("Notificações altKey+T"), e o leitor de tela o anunciava. Com a lista vazia
 * o nome é só o rótulo — como nas outras stacks.
 *
 * A lista vazia DEPENDE DE PATCH, e sem ele é pior que o atalho: a lib testa o
 * atalho com `hotkey.every(...)`, e `[].every(...)` é verdadeiro — TODA tecla
 * contava como o atalho, a pilha expandia e roubava o foco, e o Enter no botão
 * de ação deixava de dispará-la. Medido em 2026-09-14 pela story de ação, com
 * prova pareada: atalho default passava, lista vazia falhava. O
 * `vue-sonner+2.0.9.patch` acrescenta a guarda `length > 0`, que é o que a lib do
 * sonner para react já faz. Não tire o patch mantendo a lista vazia.
 */
const hotkey = computed<string[]>(() => props.hotkey ?? [])

/**
 * O tema da região acompanha a classe `dark` do DOCUMENTO.
 *
 * Este wrapper não passava tema nenhum, e a lib ficava no default `light` para
 * sempre. Os tokens da casa — e a barra de temas do Storybook — vivem na classe
 * `dark` do documento, e a folha da lib pinta a DESCRIÇÃO pelo tema DELA
 * (`#3f3f3f` no claro, `#e8e8e8` no escuro) sempre que a notificação não usa
 * `richColors`: com a página escura e o tema preso em `light`, a descrição saía
 * `rgb(63, 63, 63)` sobre o fundo `rgb(36, 49, 56)` — medido em 2026-09-14 com a
 * mesma folha, pelo lado do react. Nenhuma story via — o navegador de teste é
 * claro, e a story de tema escuro passa `theme="dark"` à mão.
 *
 * O observador é solto no desmonte, e `theme` explícito de quem consome
 * continua vencendo. Prova: `expectDescriptionReadable` em
 * `docs/shared/testing/sonner-probe.ts`.
 */
const documentTheme = ref<'light' | 'dark'>('light')
let themeObserver: MutationObserver | undefined

function readDocumentTheme(): 'light' | 'dark' {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

onMounted(() => {
  documentTheme.value = readDocumentTheme()
  themeObserver = new MutationObserver(() => {
    documentTheme.value = readDocumentTheme()
  })
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
})

onBeforeUnmount(() => {
  themeObserver?.disconnect()
  themeObserver = undefined
})

const theme = computed<ToasterProps['theme']>(() => props.theme ?? documentTheme.value)
</script>

<template>
  <!--
    Os tokens de cor da casa são TRIPLETOS HSL e só viram cor dentro de `hsl()`;
    a folha da lib usa `--normal-*` direto como cor. Passar `var(--popover)` cru
    entregava um valor inválido e a notificação caía no fundo padrão da lib.
  -->
  <Sonner
    :style="{
      '--normal-bg': 'hsl(var(--popover))',
      '--normal-text': 'hsl(var(--popover-foreground))',
      '--normal-border': 'hsl(var(--border))',
      '--border-radius': 'var(--radius)',
    }"
    v-bind="props"
    :theme="theme"
    :position="position"
    :hotkey="hotkey"
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
