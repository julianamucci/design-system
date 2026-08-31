import * as React from "react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  canWithdraw,
  type QueuedMessage,
  type QueuedMessageState,
} from "@shared/primitives/chat-protocol"

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
 * `approval` no `chat-thread` e de `onRemove` nos anexos. Uma fila que
 * enviasse sozinha traria transporte junto, e transporte envelhece por produto,
 * não por sistema.
 *
 * A FILA NÃO É REGIÃO VIVA. Cada item entrou porque a própria pessoa o
 * escreveu, e devolver em voz o que se acabou de digitar é repetir, não
 * informar. É a mesma decisão do contador de caracteres do campo e do relógio
 * do reprodutor de mídia, pelo mesmo motivo.
 *
 * DIVERGÊNCIA DE API, e só de forma: o desenho extra entra por `className` e o
 * aviso sai por `onWithdraw`, uma propriedade de retorno, porque é assim que
 * este renderizador o escreve. O nome, o argumento e o momento são os mesmos
 * das outras stacks; o que muda é o portador.
 */

export interface MessageQueueLabels {
  /** Nome acessível da fila. */
  list: string
  /** Nome do botão de retirar. `{text}` vira o texto da mensagem. */
  withdraw: string
  /**
   * A palavra de cada estado. É ela que distingue a que já saiu — a folha só
   * a deixa mais apagada, e transparência sozinha não descreve estado
   * (WCAG 1.4.1).
   */
  state: Record<QueuedMessageState, string>
}

export interface MessageQueueProps {
  /** As mensagens que esperam, na ordem em que saem. */
  messages: QueuedMessage[]
  labels: MessageQueueLabels
  /** Alguém pediu para retirar. Retirar de verdade é de quem envia. */
  onWithdraw?: (message: QueuedMessage) => void
  className?: string
}

/**
 * Monta a fila, ou nada quando não há o que esperar.
 *
 * `null` e não uma lista vazia: uma `<ol>` sem item é anunciada como "lista com
 * zero itens", que promete algo que não há. É a mesma decisão da lista de
 * contexto do campo, e aqui ela precisa morar no próprio componente — a peça é
 * autônoma, e não existe um campo por perto para decidir por ela.
 */
function MessageQueue({
  messages,
  labels,
  onWithdraw,
  className,
}: MessageQueueProps): React.ReactElement | null {
  if (messages.length === 0) return null

  return (
    // `<ol>` e não `<ul>`: aqui a ordem É a informação. Quem espera quer saber
    // que é a terceira, e uma lista não ordenada anuncia quantos itens há sem
    // dizer em que lugar cada um está.
    <ol
      data-slot="composer-queue"
      className={cn("nds-composer-queue", className)}
      aria-label={labels.list}
    >
      {messages.map((message, index) => (
        <li
          key={message.id ?? `${message.text}-${index}`}
          className="nds-composer-queue-item"
          data-slot="composer-queue-item"
          data-state={message.state}
          data-message-id={message.id}
          // O ocupado é ATRIBUTO, e o que está acontecendo é frase (decisão 3
          // da folha). Os dois juntos: quem ouve recebe o estado ocupado do
          // item e a palavra que diz o que ele significa.
          aria-busy={message.state === "sending" ? true : undefined}
        >
          {/* A posição é TEXTO no documento, e não um `::before` da folha
              (decisão 1): conteúdo gerado por folha não é confiável para leitor
              de tela e some quando a folha não carrega. O número sai do índice
              — a ordem da lista é a própria fila, e um número recebido de fora
              poderia discordar dela. */}
          <span
            className="nds-composer-queue-position"
            data-slot="composer-queue-position"
          >
            {index + 1}
          </span>

          <span className="nds-composer-queue-text" data-slot="composer-queue-text">
            {message.text}
          </span>

          {/* A palavra do estado, em etiqueta curta. É `Badge` de propósito: a
              folha da família não declara classe própria para ela, e inventar
              uma aqui deixaria o desenho fora do lugar onde as decisões moram.
              O `data-slot` da etiqueta é sobrescrito para o da fila, como o
              botão de remover do contexto já faz. */}
          <Badge data-slot="composer-queue-state">{labels.state[message.state]}</Badge>

          {/* Quem pode ser retirada sai do VOCABULÁRIO, e não de um `if` da
              tela (decisão 2 da folha). Botão que promete desfazer o que não
              desfaz é pior que botão nenhum, e cinco `if` escritos à mão
              terminariam com um deles discordando dos outros quatro. */}
          {canWithdraw(message) ? (
            // O nome acessível leva o TEXTO DA MENSAGEM (decisão 4): uma fila
            // de três botões chamados "Retirar" é um botão só para quem navega
            // por audição.
            <Button
              className="nds-composer-queue-withdraw"
              data-slot="composer-queue-withdraw"
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={labels.withdraw.replace("{text}", message.text)}
              onClick={() => onWithdraw?.(message)}
            >
              ×
            </Button>
          ) : null}
        </li>
      ))}
    </ol>
  )
}

export { MessageQueue }
