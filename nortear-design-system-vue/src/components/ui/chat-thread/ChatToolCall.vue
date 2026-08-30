<script setup lang="ts">
/**
 * Uma chamada de ferramenta dentro da resposta.
 *
 * O ESTADO vai no atributo E no texto do resumo: cor sozinha não descreve
 * estado para quem não a percebe.
 */
import ChatDisclosure from './ChatDisclosure.vue'
import { hasSlotContent } from './chat-slots'
import type { ChatMessage, ChatThreadLabels, ChatToolCall } from './index'

const props = defineProps<{
  call: ChatToolCall
  message: ChatMessage
  labels: ChatThreadLabels
}>()

const slots = defineSlots<{
  /** Controles de autorização. É um ESPAÇO, e não uma política. */
  approval?: (scope: { call: ChatToolCall; message: ChatMessage }) => unknown
}>()

/**
 * Chamado de dentro do render, e não de um `computed`: o slot só pode ser
 * invocado durante a renderização, e é ali que a resposta é usada.
 */
function approvalFilled(): boolean {
  return hasSlotContent(slots.approval?.({ call: props.call, message: props.message }))
}
</script>

<template>
  <ChatDisclosure
    kind="tool-call"
    :summary="`${call.name} · ${labels.toolState[call.state]}`"
    :data-state="call.state"
    :data-call-id="call.id"
    :open="call.state === 'pending' || undefined"
  >
    {{ call.detail }}
    <!-- O espaço da autorização. Quem desenha os botões é quem consome, e o
         componente não sabe o que aprovar significa. -->
    <div
      v-if="approvalFilled()"
      class="nds-chat-tool-call-approval"
    >
      <slot
        name="approval"
        :call="call"
        :message="message"
      />
    </div>
  </ChatDisclosure>
</template>
