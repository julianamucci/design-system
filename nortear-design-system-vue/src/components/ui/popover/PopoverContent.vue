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

/*
 * O painel é achado no DOM por um marcador PRÓPRIO, não pelo `$el` do Vue.
 *
 * Três tentativas falharam antes, e todas partiam de `panelRef.value?.$el`:
 *
 * 1. `requestAnimationFrame` até dez vezes — desistia em silêncio.
 * 2. `watch(() => panelRef.value?.$el, …)` — PIOR: `$el` não é reativo no Vue 3
 *    (é um getter para `instance.vnode.el`), e template ref é atribuído uma vez,
 *    então o watcher dispara no máximo duas vezes.
 * 3. laço de relógio de 2s a cada 50ms — e aqui veio o dado que fechou o caso:
 *    o teste reprovou em 6094ms contra 6115ms da tentativa anterior, bit a bit
 *    o mesmo. Com 2s de tentativas contra dois disparos e resultado idêntico,
 *    TEMPO não é a variável.
 *
 * O que sobra é o alvo: o conteúdo vive sob `PopoverPortal`, ou seja dentro de
 * um `Teleport`, e o `$el` do componente ali não é o nó que o leitor de tela vê.
 * Um marcador que nós mesmos escrevemos atravessa o portal junto com o elemento,
 * e `document.querySelector` o encontra onde quer que a lib o tenha posto.
 */
/*
 * O painel se identifica pelo PRÓPRIO `aria-label`, não por um marcador novo.
 *
 * A primeira versão que funcionou cravava um `data-nds-panel` só para achar o
 * elemento — atributo que nenhuma das outras quatro stacks tem, ou seja
 * divergência de markup criada para uso interno. Não é preciso: o `aria-label`
 * de quem compõe JÁ chega ao elemento por fallthrough. O que a lib vence é o
 * `aria-labelledby`, que ela escreve por conta própria — medido em 2026-09-05
 * com um experimento que removeu o mecanismo inteiro e sobrepôs por binding:
 * reprovou em 6155ms, o prazo inteiro do helper.
 *
 * A comparação é em JS, não em seletor: montar `[aria-label="..."]` com texto
 * traduzido exige escapar aspas e acentos, e escape em camada de string é onde
 * esta campanha já tropeçou três vezes.
 *
 * Dois painéis abertos com o mesmo rótulo cairiam no primeiro, e aplicar a
 * mesma correção a qualquer um deles dá no mesmo — o rótulo é o mesmo.
 */
function findPanel(): HTMLElement | null {
  const label = String(attrs['aria-label'] ?? '').trim()
  if (!label) return null
  const todos = document.querySelectorAll<HTMLElement>('[data-slot="popover-content"]')
  for (const el of todos) {
    if (el.getAttribute('aria-label') === label) return el
  }
  return null
}

function attachLabel(el: HTMLElement): void {
  applyLabel(el)
  labelObserver?.disconnect()
  labelObserver = new MutationObserver(() => applyLabel(el))
  labelObserver.observe(el, { attributes: true, attributeFilter: ['aria-labelledby', 'aria-label'] })
}

let deadline = 0
let timer: ReturnType<typeof setTimeout> | null = null

function resolvePanel(): void {
  const el = findPanel()
  if (el) {
    attachLabel(el)
    return
  }
  if (performance.now() > deadline) return
  timer = setTimeout(resolvePanel, 50)
}

onMounted(() => {
  deadline = performance.now() + 2000
  resolvePanel()
})




onBeforeUnmount(() => {
  if (timer) clearTimeout(timer)
  timer = null
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
