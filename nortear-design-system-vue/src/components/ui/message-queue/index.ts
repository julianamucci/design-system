import type { QueuedMessageState } from '@shared/primitives/chat-protocol'

export { default as MessageQueue } from './MessageQueue.vue'

/**
 * O vocabulário da FILA DE ENVIO.
 *
 * A peça é AUTÔNOMA e mora em pasta própria: ela fica ACIMA do campo, e não
 * dentro dele. Contexto, anexo e citação vivem dentro da moldura porque
 * descrevem o que ainda está sendo escrito; a fila é o oposto — é o que JÁ SAIU
 * das mãos de quem escreve. Por isso ela não entra na API do `Composer`, e quem
 * consome empilha as duas peças, nesta ordem.
 *
 * A mensagem em si — `QueuedMessage`, `QueuedMessageState` — vem de
 * `@shared/primitives/chat-protocol`, e é a mesma nas cinco stacks, junto da
 * pergunta que decide quem ainda pode ser retirada (`canWithdraw`). O que mora
 * aqui é só o texto, porque o nome da fila, o do botão de retirar e a palavra de
 * cada estado são texto de interface e têm três idiomas.
 */
export interface MessageQueueLabels {
  /** Nome acessível da fila. */
  list: string
  /** Nome do botão de retirar. `{text}` vira o texto da mensagem. */
  withdraw: string
  /**
   * A palavra de cada estado. É ela que distingue a que já saiu — a folha só a
   * deixa mais apagada, e transparência sozinha não descreve estado
   * (WCAG 1.4.1).
   */
  state: Record<QueuedMessageState, string>
}
