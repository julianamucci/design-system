export { default as ChatThread } from './ChatThread.vue'

/**
 * Os tipos da conversa.
 *
 * A API DIVERGE do que uma raiz imperativa expõe, e é assim que tem de ser.
 * Lá a raiz carrega `append` e `update(id, patch)`; aqui a LISTA é a API — quem
 * faz streaming troca (ou muda) o array. O `id` continua sendo o que sustenta a
 * mesma promessa: ele entra como `key` do `v-for`, e é a chave que faz o Vue
 * remendar a mensagem que cresce em vez de remontá-la. Remontar tiraria o foco
 * de dentro dela e fecharia um colapsável aberto, que é exatamente o que o
 * caminho cirúrgico da versão imperativa evita à mão.
 *
 * Divergência de API entre frameworks não se "alinha": registra-se. Esta é a
 * primeira das duas; a outra está logo abaixo, em `actions`.
 */
/**
 * O vocabulário vem de `chat-protocol.ts`, e não daqui.
 *
 * `ChatRole`, `ToolCallState`, `ChatToolCall` e `ChatSource` eram declarados
 * palavra por palavra em cada uma das cinco stacks — a mesma união escrita
 * cinco vezes. Com uma peça isso não custava nada; com a família inteira pela
 * frente, é assim que se produzem cinco vocabulários divergentes.
 *
 * Reexportar, e não redeclarar: o nome público desta stack não muda, e quem
 * importa daqui continua importando daqui. O que mudou é de onde a definição
 * sai. O motivo de `pending` existir separado de `running` — um espera por uma
 * PESSOA, o outro pela máquina — está escrito lá, uma vez.
 *
 * Nesta stack `ChatToolCall` sai inteiro do protocolo: o espaço de autorização
 * é um slot com escopo, não um campo do dado.
 */
// Importa E reexporta: `export … from` reexporta sem trazer o nome ao escopo,
// e este arquivo usa os quatro logo abaixo.
import type {
  ChatRole,
  ChatSource,
  ChatToolCall,
  ToolCallState,
} from '@shared/primitives/chat-protocol'

export type { ChatRole, ChatSource, ChatToolCall, ToolCallState }

export interface ChatMessage {
  /** Endereço da mensagem. É ele que entra como `key`. */
  id?: string
  role: ChatRole
  /** O conteúdo, em Markdown. Tratado como não confiável. */
  content: string
  author?: string
  /** Já formatada por quem consome: o componente não escolhe formato de hora. */
  time?: string
  /** Ligue enquanto o texto ainda chega. Desligar é o que dispara o anúncio. */
  streaming?: boolean
  toolCalls?: ChatToolCall[]
  reasoning?: string
  sources?: ChatSource[]
}

/**
 * A SEGUNDA divergência de API, e a mais visível para quem escreve Vue.
 *
 * Retrato, botões do turno e controles de autorização não entram como nó numa
 * prop: entram como SLOT COM ESCOPO — `#avatar`, `#actions`, `#approval` —, que
 * é a forma que esta stack tem para "marcação que quem consome fornece". O
 * escopo devolve a mensagem (e a chamada, na autorização), então quem escreve
 * decide turno a turno o que desenhar.
 *
 * O contrato de acessibilidade não muda com isso: o invólucro
 * `.nds-chat-message-actions` continua sendo do componente, e só nasce quando o
 * slot de fato desenhou algo — invólucro vazio somaria um `gap` em toda
 * mensagem sem ação.
 */
export interface ChatThreadLabels {
  /** Nome acessível do botão de ir ao fim. `{count}` vira o número. */
  jumpToEnd: string
  reasoning: string
  sources: string
  toolState: Record<ToolCallState, string>
}

export type ChatThreadSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
