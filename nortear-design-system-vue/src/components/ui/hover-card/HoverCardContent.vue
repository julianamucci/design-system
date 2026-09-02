<script setup lang="ts">
import type { HoverCardContentProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { inject } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import {
  HoverCardContent,
  HoverCardPortal,
  useForwardProps,
  useId,
} from 'reka-ui'
import { cn } from '@/lib/utils'
import { KEY_HOVER_CARD } from './context'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<HoverCardContentProps & { class?: HTMLAttributes['class'] }>(),
  {
    align: 'center',
    sideOffset: 4,
  },
)

const delegatedProps = reactiveOmit(props, 'class')

const forwardedProps = useForwardProps(delegatedProps)

// Sem `role`: a reka não emite papel nenhum no conteúdo, e desde 2026-09-02 o
// design system também não. O painel é conteúdo DESCRITIVO — o gatilho o aponta
// por `aria-describedby`, e é isso que faz o leitor de tela dizer o CONTEÚDO do
// cartão em vez de só o gatilho. Ver o bloco canônico em `hover-card.ts` do
// Vanilla.
//
// Sem nome próprio também: `aria-label` em elemento sem papel é
// `aria-prohibited-attr` no axe.
const panelId = useId(undefined, 'nds-hover-card-content')

const contexto = inject(KEY_HOVER_CARD, null)

// A associação é escrita quando o painel MONTA e desfeita quando ele desmonta —
// que é exatamente a janela em que o alvo existe no documento. Fechado, um
// `aria-describedby` apontando para um `id` ausente é `aria-valid-attr-value`
// no axe, então ele não pode ser prop fixa do gatilho.
//
// Ref de FUNÇÃO no conteúdo da reka, e não `onMounted` neste componente: este
// aqui está montado o tempo todo (é a reka que decide quando o painel entra),
// então o ciclo deste componente não diz nada sobre o painel.
//
// O gatilho vem do CONTEXTO, e não de uma busca no documento: com vários
// cartões na mesma tela (a story Sides), o primeiro
// `[data-slot="hover-card-trigger"]` descreveria sempre o mesmo gatilho.
let describedTrigger: HTMLElement | null = null

function associate(instance: unknown): void {
  if (instance) {
    describedTrigger = contexto?.trigger.value ?? null
    describedTrigger?.setAttribute('aria-describedby', panelId)
    return
  }
  describedTrigger?.removeAttribute('aria-describedby')
  describedTrigger = null
}
</script>

<template>
  <HoverCardPortal>
    <HoverCardContent
      :id="panelId"
      :ref="associate"
      data-slot="hover-card-content"
      v-bind="{ ...$attrs, ...forwardedProps }"
      :class="cn( 'nds-hover-card-content', props.class, )"
    >
      <slot />
    </HoverCardContent>
  </HoverCardPortal>
</template>
