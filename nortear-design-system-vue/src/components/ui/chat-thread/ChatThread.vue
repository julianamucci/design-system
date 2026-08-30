<script setup lang="ts">
/**
 * A superfície da conversa. Estrutura e cores em `nds/chat-thread.css`, que
 * também guarda as três decisões de acessibilidade que valem mais que o
 * desenho.
 *
 * A decisão de rolagem vem de `@shared/primitives/chat-scroll`, compartilhada
 * pelas cinco stacks: sem ela, cada uma escreveria o próprio `if` e a
 * divergência só apareceria com a conversa em movimento.
 *
 * A LISTA É A API, e os três mecanismos que a sustentam
 *
 * Quem faz streaming troca — ou muda — o array de mensagens, e o `id` é o que
 * mantém a mensagem no lugar enquanto ela cresce: ele vira a `key` do `v-for`,
 * e é a chave que faz o Vue REMENDAR em vez de remontar. Remontar tiraria o
 * foco de dentro da mensagem e fecharia um colapsável aberto.
 *
 * Sobre isso ficam três peças, e cada uma existe por um defeito concreto:
 *
 * 1. um `ResizeObserver` na lista, que ancora no fim enquanto o estado diz que
 *    se está no fim. É ele que faz a conversa ABRIR no fim: na montagem o
 *    `scrollHeight` ainda é zero, e sem observar o primeiro crescimento a
 *    conversa abria no turno mais antigo, com o botão já visível oferecendo ir
 *    para onde ela devia ter aberto;
 * 2. a contagem das chegadas UMA a uma, num observador de `flush: 'post'` —
 *    o equivalente idiomático desta stack ao efeito que roda depois do DOM e
 *    antes da pintura. O contrato do `chat-scroll` é explícito: medir ANTES de
 *    inserir. Aqui a medida não é relida do elemento (o `scrollHeight` já
 *    mudou); ela é o ESTADO guardado, que ainda descreve a rolagem de antes,
 *    porque conteúdo que cresce não dispara evento de rolagem;
 * 3. o anúncio na TRANSIÇÃO de streaming `true → false`. Anunciar a cada
 *    trecho tornaria a leitura impossível, e anunciar na chegada não anunciaria
 *    nada — a mensagem nasce vazia.
 *
 * O que muda de INSTRUMENTO nesta stack: numa stack de closures o estado
 * precisa viver duas vezes (uma para o desenho, outra para os ouvintes lerem
 * sem ficar presos ao render em que nasceram). Aqui um `shallowRef` é o mesmo
 * objeto que o template lê e que o ouvinte de rolagem escreve, então a segunda
 * cópia não existe. E a mudança pode chegar por MUTAÇÃO do array (é assim que
 * um `ref` de lista se usa), não só por troca — por isso os observadores olham
 * o que precisam campo a campo, e guardam o retrato anterior à parte.
 */
import { computed, onBeforeUnmount, onMounted, shallowRef, watch, type HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'
import ChatMessage from './ChatMessage.vue'
import {
  BOTTOM_THRESHOLD,
  initialThreadScroll,
  onJumpToEnd,
  onThreadMessage,
  onThreadScroll,
  shouldFollow,
  type ThreadScrollState,
} from '@shared/primitives/chat-scroll'
import type {
  ChatMessage as ChatMessageData,
  ChatRole,
  ChatThreadLabels,
  ChatThreadSize,
  ChatToolCall,
} from './index'

const props = defineProps<{
  /** As mensagens, em ordem. Cada uma traz papel, conteúdo e o que mais tiver. */
  messages: ChatMessageData[]
  /** O texto da interface. Sem padrão em inglês escondido. */
  labels: ChatThreadLabels
  /** Falha da EXECUÇÃO, e não de uma ferramenta. */
  error?: string
  /**
   * Altura da janela da conversa, na escada do sistema.
   *
   * Sem ela não há transbordo, e sem transbordo a ancoragem no fim não
   * acontece. Quem precisar de uma altura fora da escada declara `--box-height`
   * na raiz.
   */
  size?: ChatThreadSize
  class?: HTMLAttributes['class']
}>()

defineSlots<{
  /** Retrato de quem falou. */
  avatar?: (scope: { message: ChatMessageData }) => unknown
  /** Botões do turno. Aparecem no hover E no foco. */
  actions?: (scope: { message: ChatMessageData }) => unknown
  /** Controles de autorização de uma chamada que espera por uma pessoa. */
  approval?: (scope: { call: ChatToolCall; message: ChatMessageData }) => unknown
}>()

const viewport = shallowRef<HTMLDivElement | null>(null)
const list = shallowRef<HTMLOListElement | null>(null)
const scroll = shallowRef<ThreadScrollState>(initialThreadScroll)
const announcement = shallowRef('')

function metrics() {
  const element = viewport.value
  if (!element) return null
  return {
    scrollTop: element.scrollTop,
    scrollHeight: element.scrollHeight,
    clientHeight: element.clientHeight,
  }
}

function scrollToEnd() {
  const element = viewport.value
  if (element) element.scrollTop = element.scrollHeight
}

function handleScroll() {
  const current = metrics()
  if (current) scroll.value = onThreadScroll(scroll.value, current, BOTTOM_THRESHOLD)
}

function jumpToEnd() {
  scrollToEnd()
  scroll.value = onJumpToEnd()
}

// ── 1. Manter o fim colado enquanto se está nele ─────────────────────────────
//
// Resolve dois casos com a mesma regra: o primeiro layout é um crescimento de
// zero para a altura real, e imagem ou fonte que chega depois é outro. Só age
// quando o estado diz que se está no fim: quem rolou para trás não é arrastado.

let anchor: ResizeObserver | null = null

onMounted(() => {
  const element = list.value
  if (!element) return
  anchor = new ResizeObserver(() => {
    if (!scroll.value.atBottom) return
    scrollToEnd()
  })
  anchor.observe(element)
})

onBeforeUnmount(() => {
  anchor?.disconnect()
  anchor = null
})

// ── 2. A chegada de mensagem, contada uma a uma ──────────────────────────────

let seenLength = props.messages.length

watch(
  () => props.messages.length,
  (length) => {
    const before = seenLength
    seenLength = length
    if (length <= before) return

    // Lido ANTES de contar: `shouldFollow` responde sobre a rolagem de antes de
    // o conteúdo crescer, que é a única resposta útil aqui.
    const follow = shouldFollow(scroll.value)
    let next = scroll.value
    for (let i = before; i < length; i += 1) next = onThreadMessage(next)
    scroll.value = next

    if (follow) scrollToEnd()
  },
  { flush: 'post' },
)

// ── 3. O anúncio, na transição de streaming ──────────────────────────────────

type AnnounceView = { id?: string; role: ChatRole; streaming: boolean; content: string }

/**
 * O retrato do que interessa ao anúncio.
 *
 * Ler campo a campo é o que faz o observador acordar quando a mensagem MUDA
 * dentro do mesmo array — o caminho normal de quem guarda a conversa num `ref`
 * e remenda o turno que cresce.
 */
function announceView(messages: ChatMessageData[]): AnnounceView[] {
  return messages.map((message) => ({
    id: message.id,
    role: message.role,
    streaming: message.streaming === true,
    content: message.content,
  }))
}

let announced = announceView(props.messages)

watch(
  () => announceView(props.messages),
  (current) => {
    const before = announced
    announced = current
    for (const message of current) {
      if (message.role !== 'assistant') continue
      const same = before.find((earlier) => earlier.id != null && earlier.id === message.id)
      if (same?.streaming && !message.streaming) announcement.value = message.content
      // Mensagem que já chega pronta também é anunciada, uma vez.
      if (!same && !message.streaming && before.length < current.length) {
        announcement.value = message.content
      }
    }
  },
  { flush: 'post' },
)

const jumpLabel = computed(() =>
  props.labels.jumpToEnd.replace('{count}', String(scroll.value.unread)),
)
</script>

<template>
  <div
    data-slot="chat-thread"
    :class="cn('nds-chat-thread', props.class)"
    :data-size="size"
  >
    <!-- Quem ROLA é este elemento, e é dele que sai a medida. `tabindex` fixo,
         e não prop: região rolável tem de ser alcançável por teclado (WCAG
         2.1.1), e torná-lo configurável só criaria o jeito de desligar a única
         coisa que faz a rolagem existir para quem não usa mouse. -->
    <div
      ref="viewport"
      class="nds-chat-thread-viewport"
      tabindex="0"
      @scroll="handleScroll"
    >
      <ol
        ref="list"
        class="nds-chat-thread-list"
      >
        <ChatMessage
          v-for="(message, i) in messages"
          :key="message.id ?? i"
          :message="message"
          :labels="labels"
        >
          <template #avatar="scope">
            <slot
              name="avatar"
              v-bind="scope"
            />
          </template>
          <template #actions="scope">
            <slot
              name="actions"
              v-bind="scope"
            />
          </template>
          <template #approval="scope">
            <slot
              name="approval"
              v-bind="scope"
            />
          </template>
        </ChatMessage>
      </ol>
    </div>

    <!-- `role="alert"` — e isto NÃO contradiz a regra de que a conversa não é
         região viva. Aquela é sobre texto em streaming, que chega em cem
         pedaços; isto é uma frase curta e definitiva. Fica FORA da lista porque
         não é um turno: ninguém disse isso. -->
    <p
      class="nds-chat-thread-error"
      data-slot="chat-thread-error"
      role="alert"
      :hidden="!error"
    >
      {{ error }}
    </p>

    <button
      type="button"
      class="nds-chat-thread-jump nds-button nds-button-secondary nds-button-sm"
      data-slot="chat-thread-jump"
      :hidden="scroll.atBottom"
      :aria-label="jumpLabel"
      @click="jumpToEnd"
    >
      {{ jumpLabel }}
    </button>

    <!-- A ÚNICA região viva de texto da thread. -->
    <div
      class="nds-chat-thread-announcer"
      aria-live="polite"
      aria-atomic="true"
    >
      {{ announcement }}
    </div>
  </div>
</template>
