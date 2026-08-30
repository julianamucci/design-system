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
export type ChatRole = 'user' | 'assistant' | 'system'

/**
 * Estados de uma chamada de ferramenta.
 *
 * `pending` é a espera por uma PESSOA, e não pela máquina: a ferramenta foi
 * proposta e ainda não foi autorizada. Ela existe separada de `running` porque
 * as duas se parecem na tela e são coisas opostas — numa, quem está devendo
 * resposta é o sistema; na outra, quem lê.
 */
export type ToolCallState = 'pending' | 'running' | 'done' | 'failed'

export interface ChatToolCall {
  /** Endereço da chamada. É ele que entra como `key` da lista de chamadas. */
  id?: string
  name: string
  state: ToolCallState
  /** Detalhe da chamada — argumentos, resultado, erro. Texto simples. */
  detail?: string
}

export interface ChatSource {
  title: string
  url: string
}

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
