<script setup lang="ts">
/**
 * As mensagens escritas enquanto a anterior ainda era respondida.
 *
 * Desenho em `nds/composer.css`, no bloco da fila de envio, que também guarda
 * as cinco decisões de acessibilidade. O vocabulário — `QueuedMessage`,
 * `QueuedMessageState`, `canWithdraw` — vem de
 * `@shared/primitives/chat-protocol`.
 *
 * A PEÇA É AUTÔNOMA, e fica ACIMA do campo em vez de dentro dele. Contexto,
 * anexo e citação vivem dentro da moldura porque descrevem o que ainda está
 * sendo escrito; a fila é o oposto — é o que JÁ SAIU das mãos de quem escreve,
 * e pô-la dentro do campo a misturaria com o que ainda não saiu. Quem consome
 * empilha as duas peças, nesta ordem.
 *
 * A DECISÃO QUE GOVERNA A PEÇA: ela não envia nada. Enviar, reordenar e decidir
 * o que acontece com o que foi retirado é de quem consome — a mesma divisão de
 * `approval` no `chat-thread` e do pedido de remover um anexo. Uma fila que
 * enviasse sozinha traria transporte junto, e transporte envelhece por produto,
 * não por sistema.
 *
 * A FILA NÃO É REGIÃO VIVA. Cada item entrou porque a própria pessoa o
 * escreveu, e devolver em voz o que se acabou de digitar é repetir, não
 * informar. É a mesma decisão do contador de caracteres do campo e do relógio
 * do reprodutor de mídia, pelo mesmo motivo.
 *
 * DIVERGÊNCIA DE API DE FRAMEWORK, registrada e não "alinhada": o aviso de que
 * alguém pediu para retirar é um EVENTO (`@withdraw`), e não um retorno que se
 * passa por prop (`onWithdraw`, na raiz imperativa da referência). O conceito é
 * o mesmo dos dois lados — quem envia é quem retira de verdade; o que muda é
 * por onde o pedido sai.
 */
import type { HTMLAttributes } from 'vue'
import { canWithdraw, type QueuedMessage } from '@shared/primitives/chat-protocol'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { MessageQueueLabels } from './index'

const props = defineProps<{
  /** As mensagens que esperam, na ordem em que saem. */
  messages: QueuedMessage[]
  labels: MessageQueueLabels
  class?: HTMLAttributes['class']
}>()

const emit = defineEmits<{
  /** Alguém pediu para retirar. Retirar de verdade é de quem envia. */
  withdraw: [message: QueuedMessage]
}>()

/**
 * O nome acessível leva o TEXTO DA MENSAGEM (decisão 4 da folha): uma fila de
 * três botões chamados "Retirar" é um botão só para quem navega por audição.
 */
function withdrawLabel(message: QueuedMessage): string {
  return props.labels.withdraw.replace('{text}', message.text)
}

/**
 * A decisão 2 da folha, e a máquina dela mora no protocolo: quem já está indo
 * não oferece retirar, porque a mensagem já saiu e o que acontece depois disso
 * é do produto. Botão que promete desfazer o que não desfaz é pior que botão
 * nenhum.
 *
 * A pergunta vai ao vocabulário compartilhado, e não a um `if (state === …)`
 * escrito aqui: cinco stacks escreveriam cinco versões da mesma regra, e uma
 * delas discordaria.
 */
function isWithdrawable(message: QueuedMessage): boolean {
  return canWithdraw(message)
}

function requestWithdraw(message: QueuedMessage): void {
  emit('withdraw', message)
}
</script>

<template>
  <!-- Sem mensagem, a fila NÃO EXISTE no documento. Não é uma lista vazia
       escondida: é ausência. Uma `<ol>` sem item é anunciada como "lista com
       zero itens", que promete algo que não há — e a peça é autônoma, então não
       há um campo por perto para decidir por ela.

       `<ol>` e não `<ul>`: aqui a ordem É a informação. Quem espera quer saber
       que é a terceira, e uma lista não ordenada anuncia quantos itens há sem
       dizer em que lugar cada um está.

       Nada de `aria-live`, `role="log"` ou `role="status"`: cada item entrou
       porque a própria pessoa o escreveu. -->
  <ol
    v-if="messages.length > 0"
    data-slot="composer-queue"
    :class="cn('nds-composer-queue', props.class)"
    :aria-label="labels.list"
  >
    <li
      v-for="(message, index) in messages"
      :key="message.id ?? index"
      data-slot="composer-queue-item"
      class="nds-composer-queue-item"
      :data-state="message.state"
      :data-message-id="message.id"
      :aria-busy="message.state === 'sending' ? 'true' : undefined"
    >
      <!-- A posição é TEXTO no documento, e não um `::before` da folha
           (decisão 1): conteúdo gerado por folha não é confiável para leitor de
           tela e some quando a folha não carrega. O número sai do índice — a
           ordem da lista é a própria fila, e um número recebido de fora poderia
           discordar dela. -->
      <span
        data-slot="composer-queue-position"
        class="nds-composer-queue-position"
      >{{ index + 1 }}</span>

      <span
        data-slot="composer-queue-text"
        class="nds-composer-queue-text"
      >{{ message.text }}</span>

      <!-- A palavra do estado, em etiqueta curta. É o `Badge` de propósito: a
           folha da família não declara classe própria para ela, e inventar uma
           aqui deixaria o desenho fora do lugar onde as decisões moram. O
           `data-slot` é sobrescrito para a peça se achar no documento. -->
      <Badge data-slot="composer-queue-state">{{ labels.state[message.state] }}</Badge>

      <Button
        v-if="isWithdrawable(message)"
        class="nds-composer-queue-withdraw"
        data-slot="composer-queue-withdraw"
        variant="ghost"
        size="icon-sm"
        :aria-label="withdrawLabel(message)"
        @click="requestWithdraw(message)"
      >
        ×
      </Button>
    </li>
  </ol>
</template>
