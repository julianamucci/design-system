<script setup lang="ts">
import type { PopoverContentEmits, PopoverContentProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import {
  PopoverContent,
  PopoverPortal,
  useForwardPropsEmits,
} from 'reka-ui'
import { computed, inject, onBeforeUnmount, onMounted, ref, useAttrs } from 'vue'
import { cn } from '@/lib/utils'
import { POPOVER_MODAL } from './popover.context'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<PopoverContentProps & { class?: HTMLAttributes['class'] }>(),
  {
    align: 'center',
    sideOffset: 4,
  },
)
const emits = defineEmits<PopoverContentEmits>()

const delegatedProps = reactiveOmit(props, 'class')

const forwarded = useForwardPropsEmits(delegatedProps, emits)

/**
 * `aria-modal` — nosso, porque nenhum caminho do primitivo o emite.
 *
 * SÓ no modo modal, e nunca `"false"` no padrão: o atributo ausente e o negado
 * dizem a mesma coisa ao leitor de tela, e anunciar inércia sem o foco preso
 * seria mentira. Quem prende o foco aqui é a lib — com `modal`, o painel que
 * renderiza é o modal, com `trap-focus` ligado —, então o anúncio é verdadeiro.
 */
const modal = inject(POPOVER_MODAL, computed(() => false))
const ariaModal = computed(() => (modal.value ? 'true' : undefined))

// Sem nome acessível de reserva aqui: a lib já aponta o `aria-labelledby` do
// painel para o GATILHO, que é exatamente o comportamento desejado quando não
// há título — o mesmo que o Vanilla, referência cross-stack, produz. Quando há
// `PopoverTitle`, é ele que reivindica o nome (ver PopoverTitle.vue): quem sabe
// que o título existe é o próprio título, e ele monta junto com o painel.

/**
 * `aria-label` DECLARADO por quem compõe vence o `aria-labelledby` da lib.
 *
 * Mesma raiz do `PopoverTitle.vue`: o `mergeProps` do primitivo escreve o
 * `aria-labelledby` (o id do GATILHO) por último, e nem prop nem atributo o
 * sobrepõem. Passar `aria-label` sozinho seria silencioso — os dois no mesmo
 * elemento fazem o leitor de tela ler o `labelledby` e ignorar o rótulo.
 *
 * Por isso a correção é no DOM, e só quando o painel não tem título: com
 * título quem manda é o `PopoverTitle`, que remove o `aria-label` de volta.
 * O observador reafirma porque cada re-render da lib reescreve o valor dela.
 */
const attrs = useAttrs()
const panelRef = ref<{ $el?: unknown } | null>(null)
let labelObserver: MutationObserver | null = null

function applyLabel(el: HTMLElement): void {
  const label = String(attrs['aria-label'] ?? '').trim()
  if (!label) return
  if (el.querySelector('[data-slot="popover-title"]')) return
  if (el.getAttribute('aria-labelledby')) el.removeAttribute('aria-labelledby')
  if (el.getAttribute('aria-label') !== label) el.setAttribute('aria-label', label)
}

function resolvePanel(attempt = 0): void {
  const el = panelRef.value?.$el
  if (!(el instanceof HTMLElement)) {
    // O `$el` do `Presence` começa como comentário e vira o nó no quadro
    // seguinte — ler uma vez só perderia o painel na abertura.
    if (attempt < 10) requestAnimationFrame(() => resolvePanel(attempt + 1))
    return
  }
  applyLabel(el)
  labelObserver?.disconnect()
  labelObserver = new MutationObserver(() => applyLabel(el))
  labelObserver.observe(el, { attributes: true, attributeFilter: ['aria-labelledby', 'aria-label'] })
}

onMounted(() => resolvePanel())

onBeforeUnmount(() => {
  labelObserver?.disconnect()
  labelObserver = null
})
</script>

<template>
  <PopoverPortal>
    <PopoverContent
      ref="panelRef"
      data-slot="popover-content"
      v-bind="{ ...$attrs, ...forwarded }"
      :aria-modal="ariaModal"
      :class="cn( 'nds-popover-content', props.class, )"
    >
      <slot />
    </PopoverContent>
  </PopoverPortal>
</template>
