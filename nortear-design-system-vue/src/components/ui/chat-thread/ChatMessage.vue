<script setup lang="ts">
/**
 * Um turno da conversa.
 *
 * Duas colunas: retrato e corpo. O retrato é opcional e a coluna some com ele.
 * O conteúdo é delegado ao Markdown — que não interpreta HTML, o que importa
 * aqui mais do que em qualquer outro lugar: num chat o texto vem de um modelo.
 */
import { Markdown } from '@/components/ui/markdown'
import ChatDisclosure from './ChatDisclosure.vue'
import ChatSources from './ChatSources.vue'
import ChatToolCall from './ChatToolCall.vue'
import { hasSlotContent } from './chat-slots'
import type { ChatMessage, ChatThreadLabels, ChatToolCall as ChatToolCallData } from './index'

const props = defineProps<{
  message: ChatMessage
  labels: ChatThreadLabels
}>()

const slots = defineSlots<{
  avatar?: (scope: { message: ChatMessage }) => unknown
  actions?: (scope: { message: ChatMessage }) => unknown
  approval?: (scope: { call: ChatToolCallData; message: ChatMessage }) => unknown
}>()

/** Chamado de dentro do render — é ali que o slot pode ser invocado. */
function filled(name: 'avatar' | 'actions'): boolean {
  return hasSlotContent(slots[name]?.({ message: props.message }))
}
</script>

<template>
  <li
    class="nds-chat-message"
    data-slot="chat-message"
    :data-role="message.role"
    :data-message-id="message.id"
    :aria-busy="message.streaming ? 'true' : undefined"
  >
    <div
      v-if="filled('avatar')"
      class="nds-chat-message-avatar"
    >
      <slot
        name="avatar"
        :message="message"
      />
    </div>
    <div class="nds-chat-message-body">
      <div
        v-if="message.author || message.time"
        class="nds-chat-message-header"
      >
        <span
          v-if="message.author"
          class="nds-chat-message-author"
        >{{ message.author }}</span>
        <time v-if="message.time">{{ message.time }}</time>
      </div>

      <!-- O raciocínio vem ANTES da resposta, fechado: é o caminho, e quem lê
           quer o destino primeiro. -->
      <ChatDisclosure
        v-if="message.reasoning"
        kind="reasoning"
        :summary="labels.reasoning"
      >
        {{ message.reasoning }}
      </ChatDisclosure>

      <!-- O contêiner só nasce quando há chamadas. Numa stack sem remendo
           cirúrgico ele não tem outra razão de existir, e vazio somaria o `gap`
           do corpo em toda mensagem sem ferramenta. -->
      <div
        v-if="message.toolCalls?.length"
        class="nds-chat-message-tools"
      >
        <ChatToolCall
          v-for="(call, i) in message.toolCalls"
          :key="call.id ?? i"
          :call="call"
          :message="message"
          :labels="labels"
        >
          <template #approval="scope">
            <slot
              name="approval"
              v-bind="scope"
            />
          </template>
        </ChatToolCall>
      </div>

      <div class="nds-chat-message-content">
        <Markdown
          :content="message.content"
          :streaming="message.streaming"
        />
      </div>

      <ChatSources
        v-if="message.sources?.length"
        :sources="message.sources"
        :title="labels.sources"
      />

      <div
        v-if="filled('actions')"
        class="nds-chat-message-actions"
      >
        <slot
          name="actions"
          :message="message"
        />
      </div>
    </div>
  </li>
</template>
