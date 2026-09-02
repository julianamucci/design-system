<script setup lang="ts">
import type { HoverCardContentProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { inject, onUnmounted, watch } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import {
  HoverCardContent,
  HoverCardPortal,
  injectHoverCardRootContext,
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

// A associação segue a ABERTURA da raiz, e não o ciclo de vida deste
// componente. Medido na fonte da reka: `HoverCardContent` monta um `<Presence>`
// por dentro, então ELE está montado o tempo todo — quem entra e sai do
// documento é o `HoverCardContentImpl` que o `Presence` decide renderizar. Um
// `ref` de função ou um `onMounted` aqui dispararia com o cartão fechado, e o
// gatilho ficaria descrevendo um `id` fora do documento: `aria-valid-attr-value`
// no axe, exatamente o que se quer evitar.
//
// `flush: 'post'` para o atributo ser escrito depois de o painel entrar no DOM.
//
// O gatilho vem do CONTEXTO, e não de uma busca no documento: com vários
// cartões na mesma tela (a story Sides), o primeiro
// `[data-slot="hover-card-trigger"]` seria descrito por todos eles.
const rootContext = injectHoverCardRootContext()

let describedTrigger: HTMLElement | null = null

function clearAssociation(): void {
  describedTrigger?.removeAttribute('aria-describedby')
  describedTrigger = null
}

watch(
  () => rootContext.open.value,
  (isOpen) => {
    if (!isOpen) {
      clearAssociation()
      return
    }
    describedTrigger = contexto?.trigger.value ?? null
    describedTrigger?.setAttribute('aria-describedby', panelId)
  },
  { immediate: true, flush: 'post' },
)

// Sair da página com o cartão aberto (troca de story, navegação) não passa pelo
// `watch`: sem isto o gatilho — se sobreviver — ficaria com a descrição presa.
onUnmounted(clearAssociation)
</script>

<template>
  <HoverCardPortal>
    <HoverCardContent
      :id="panelId"
      data-slot="hover-card-content"
      v-bind="{ ...$attrs, ...forwardedProps }"
      :class="cn( 'nds-hover-card-content', props.class, )"
    >
      <slot />
    </HoverCardContent>
  </HoverCardPortal>
</template>
