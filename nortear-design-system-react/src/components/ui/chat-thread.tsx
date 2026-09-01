import * as React from "react"

import { cn } from "@/lib/utils"
import { Markdown } from "@/components/ui/markdown"
import {
  BOTTOM_THRESHOLD,
  initialThreadScroll,
  onJumpToEnd,
  onThreadMessage,
  onThreadScroll,
  shouldFollow,
  type ThreadScrollState,
} from "@shared/primitives/chat-scroll"
// No call site, e não atrás de um invólucro local: é o que faz a análise
// estática reconhecer a validação onde ela acontece.
import { isSafeUrl } from "@shared/primitives/markdown-ast"
import { LABELS_CHAT_THREAD_DEFAULT } from "@shared/primitives/chat-thread-labels"
// O vocabulário vem de `chat-protocol.ts`, e não daqui: era a mesma união
// escrita nas cinco stacks. O motivo de `pending` existir separado de
// `running` — um espera por uma PESSOA, o outro pela máquina — está escrito
// lá, uma vez.
import type {
  ChatRole,
  ChatSource,
  ToolCallState,
  ChatToolCall as ChatToolCallData,
} from "@shared/primitives/chat-protocol"

// Reexporta o que importou: `export … from` não traz o nome ao escopo, e este
// arquivo usa os três. O nome público da stack não muda.
export type { ChatRole, ChatSource, ToolCallState }

/**
 * A superfície da conversa. Estrutura e cores em `nds/chat-thread.css`, que
 * também guarda as três decisões de acessibilidade que valem mais que o
 * desenho.
 *
 * O conteúdo de cada mensagem é delegado ao Markdown — que não interpreta HTML,
 * o que importa aqui mais do que em qualquer outro lugar: num chat o texto vem
 * de um modelo.
 *
 * A decisão de rolagem vem de `@shared/primitives/chat-scroll`, compartilhada
 * pelas cinco stacks: sem ela, cada uma escreveria o próprio `if` e a
 * divergência só apareceria com a conversa em movimento.
 *
 * A API DIVERGE do Vanilla, e é assim que tem de ser. Lá a raiz expõe
 * `append` e `update(id, patch)`; aqui a LISTA é a API — quem faz streaming
 * troca o array. O `id` continua sendo o que sustenta a mesma promessa: ele
 * entra como `key`, e é a chave que faz o React remendar a mensagem que cresce
 * em vez de remontá-la. Remontar tiraria o foco de dentro dela e fecharia um
 * colapsável aberto, que é exatamente o que o caminho cirúrgico do Vanilla
 * evita à mão.
 */
/**
 * A chamada de ferramenta, com o espaço de interface desta stack.
 *
 * A forma dos DADOS é compartilhada; o que fica aqui é o que não pode ser — o
 * tipo do espaço que quem consome preenche. No protocolo ele não cabe, porque
 * lá não há framework, e é essa ausência que faz o módulo servir às cinco.
 */
export interface ChatToolCall extends ChatToolCallData {
  /** Controles de autorização. É um espaço, não uma política. */
  approval?: React.ReactNode
}

export interface ChatMessage {
  /** Endereço da mensagem. É ele que entra como `key`. */
  id?: string
  role: ChatRole
  content: string
  author?: string
  time?: string
  avatar?: React.ReactNode
  streaming?: boolean
  toolCalls?: ChatToolCall[]
  reasoning?: string
  sources?: ChatSource[]
  actions?: React.ReactNode
}

export interface ChatThreadLabels {
  /** `{count}` vira o número de mensagens não lidas. */
  jumpToEnd: string
  reasoning: string
  sources: string
  toolState: Record<ToolCallState, string>
}

export interface ChatThreadProps extends Omit<React.ComponentProps<"div">, "children"> {
  messages: ChatMessage[]
  labels: ChatThreadLabels
  /** Falha da EXECUÇÃO, e não de uma ferramenta. */
  error?: string
  size?: "xs" | "sm" | "md" | "lg" | "xl"
  /**
   * Nome acessível da área que rola, que entra na ordem de tabulação.
   *
   * Tem padrão porque o design system sabe o que a região é — uma conversa — e
   * porque quem compõe não pensa em nomear um elemento que não se vê. Dê nomes
   * DISTINTOS quando houver mais de uma conversa na mesma tela.
   */
  regionLabel?: string
}

function Chevron({ className }: { className: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn("nds-icon", className)}
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}

/**
 * `<details>` nativo: o conteúdo continua encontrável pela busca do navegador
 * com a caixa fechada, e uma thread com dezenas deles não paga JavaScript por
 * mensagem.
 */
function Disclosure({
  kind,
  summary,
  children,
  ...props
}: {
  kind: "tool-call" | "reasoning"
  summary: string
  children?: React.ReactNode
} & React.ComponentProps<"details">) {
  return (
    <details className={`nds-chat-${kind}`} {...props}>
      <summary className={`nds-chat-${kind}-summary`}>
        <Chevron className={`nds-chat-${kind}-icon`} />
        <span>{summary}</span>
      </summary>
      <div className={`nds-chat-${kind}-body`}>{children}</div>
    </details>
  )
}

function ToolCall({ call, labels }: { call: ChatToolCall; labels: ChatThreadLabels }) {
  return (
    <Disclosure
      kind="tool-call"
      summary={`${call.name} · ${labels.toolState[call.state]}`}
      data-state={call.state}
      data-call-id={call.id}
      // A chamada que espera por uma pessoa nasce ABERTA: pedir autorização
      // dentro de uma caixa fechada é pedir sem mostrar.
      open={call.state === "pending" || undefined}
    >
      {call.detail}
      {call.approval ? <div className="nds-chat-tool-call-approval">{call.approval}</div> : null}
    </Disclosure>
  )
}

function Sources({ sources, title }: { sources: ChatSource[]; title: string }) {
  return (
    <div>
      <p className="nds-chat-message-header">{title}</p>
      {/* `<ol>`: a numeração é do CONTEÚDO — é por ela que o texto se refere à
          fonte —, então vem da lista, e não de um `::before` decorativo. */}
      <ol className="nds-chat-sources">
        {sources.map((source, i) => (
          <li key={source.url}>
            {/* A fonte vem de quem gerou a resposta, e endereço vindo dali é
                ENTRADA, não constante: `javascript:` num `href` executa. Sem
                protocolo seguro a fonte continua legível e deixa de ser
                clicável — a mesma decisão do Markdown, que descarta o endereço
                e preserva o texto. */}
            {isSafeUrl(source.url) ? (
              <a className="nds-chat-source" href={source.url} rel="noreferrer">
                <span className="nds-chat-source-index">{i + 1}</span>
                {source.title}
              </a>
            ) : (
              <span className="nds-chat-source" data-unsafe="">
                <span className="nds-chat-source-index">{i + 1}</span>
                {source.title}
              </span>
            )}
          </li>
        ))}
      </ol>
    </div>
  )
}

function Message({ message, labels }: { message: ChatMessage; labels: ChatThreadLabels }) {
  return (
    <li
      className="nds-chat-message"
      data-slot="chat-message"
      data-role={message.role}
      data-message-id={message.id}
      // Ocupada enquanto gera, e NÃO região viva: anunciar a cada trecho
      // tornaria a conversa impossível de ouvir.
      aria-busy={message.streaming || undefined}
    >
      {message.avatar ? <div className="nds-chat-message-avatar">{message.avatar}</div> : null}
      <div className="nds-chat-message-body">
        {message.author || message.time ? (
          <div className="nds-chat-message-header">
            {message.author ? (
              <span className="nds-chat-message-author">{message.author}</span>
            ) : null}
            {message.time ? <time>{message.time}</time> : null}
          </div>
        ) : null}

        {/* O raciocínio vem ANTES da resposta, fechado: é o caminho, e quem lê
            quer o destino primeiro. */}
        {message.reasoning ? (
          <Disclosure kind="reasoning" summary={labels.reasoning}>
            {message.reasoning}
          </Disclosure>
        ) : null}

        <div className="nds-chat-message-tools">
          {(message.toolCalls ?? []).map((call, i) => (
            <ToolCall key={call.id ?? i} call={call} labels={labels} />
          ))}
        </div>

        <div className="nds-chat-message-content">
          <Markdown content={message.content} streaming={message.streaming} />
        </div>

        {message.sources?.length ? (
          <Sources sources={message.sources} title={labels.sources} />
        ) : null}

        {message.actions ? (
          <div className="nds-chat-message-actions">{message.actions}</div>
        ) : null}
      </div>
    </li>
  )
}

function ChatThread({
  messages,
  labels,
  error,
  size,
  regionLabel = LABELS_CHAT_THREAD_DEFAULT.region,
  className,
  ...props
}: ChatThreadProps) {
  const viewportRef = React.useRef<HTMLDivElement>(null)
  const listRef = React.useRef<HTMLOListElement>(null)
  const [scroll, setScroll] = React.useState<ThreadScrollState>(initialThreadScroll)

  // O estado também vive num ref porque quem o lê são efeitos e ouvintes, que
  // não podem depender da closure do render em que foram criados.
  const scrollRef = React.useRef(scroll)
  const aplicar = React.useCallback((next: ThreadScrollState) => {
    if (next === scrollRef.current) return
    scrollRef.current = next
    setScroll(next)
  }, [])

  const medir = () => {
    const el = viewportRef.current
    return el
      ? { scrollTop: el.scrollTop, scrollHeight: el.scrollHeight, clientHeight: el.clientHeight }
      : null
  }

  const handleScroll = () => {
    const metrics = medir()
    if (metrics) aplicar(onThreadScroll(scrollRef.current, metrics, BOTTOM_THRESHOLD))
  }

  const irAoFim = () => {
    const el = viewportRef.current
    if (el) el.scrollTop = el.scrollHeight
    aplicar(onJumpToEnd())
  }

  /**
   * Manter o fim colado enquanto se está nele.
   *
   * Resolve dois casos com a mesma regra: o primeiro layout é um crescimento de
   * zero para a altura real — é o que faz a conversa ABRIR no fim, e não no
   * turno mais antigo — e imagem ou fonte que chega depois é outro. Só age
   * quando o estado diz que se está no fim: quem rolou para trás não é
   * arrastado.
   */
  React.useEffect(() => {
    const listEl = listRef.current
    if (!listEl) return
    const observador = new ResizeObserver(() => {
      if (!scrollRef.current.atBottom) return
      const el = viewportRef.current
      if (el) el.scrollTop = el.scrollHeight
    })
    observador.observe(listEl)
    return () => observador.disconnect()
  }, [])

  /**
   * A chegada de mensagem, contada uma a uma.
   *
   * `useLayoutEffect` porque a leitura tem de acontecer antes da pintura; e o
   * estado consultado é o do REF, que ainda descreve a rolagem de antes de o
   * conteúdo crescer — o evento de rolagem do conteúdo novo ainda não ocorreu.
   * É o mesmo contrato do Vanilla, com outro instrumento: medir antes, agir
   * depois.
   */
  const previousMessages = React.useRef<ChatMessage[]>(messages)
  React.useLayoutEffect(() => {
    const antes = previousMessages.current
    previousMessages.current = messages
    if (messages.length <= antes.length) return

    const seguir = shouldFollow(scrollRef.current)
    let nextState = scrollRef.current
    for (let i = antes.length; i < messages.length; i++) nextState = onThreadMessage(nextState)
    aplicar(nextState)

    if (seguir) {
      const el = viewportRef.current
      if (el) el.scrollTop = el.scrollHeight
    }
  }, [messages, aplicar])

  /**
   * O anúncio é da TRANSIÇÃO: a mensagem estava chegando e parou de chegar.
   *
   * Anunciar a cada trecho tornaria a leitura impossível, e anunciar na chegada
   * não anunciaria nada — a mensagem nasce vazia.
   */
  const [anuncio, setAnuncio] = React.useState("")
  const previousAnnounced = React.useRef<ChatMessage[]>(messages)
  React.useEffect(() => {
    const antes = previousAnnounced.current
    previousAnnounced.current = messages
    for (const message of messages) {
      if (message.role !== "assistant") continue
      const igual = antes.find((m) => (m.id ?? null) !== null && m.id === message.id)
      if (igual?.streaming && !message.streaming) setAnuncio(message.content)
      // Mensagem que já chega pronta também é anunciada, uma vez.
      if (!igual && !message.streaming && antes.length < messages.length) {
        setAnuncio(message.content)
      }
    }
  }, [messages])

  const jumpLabel = labels.jumpToEnd.replace("{count}", String(scroll.unread))

  return (
    <div
      data-slot="chat-thread"
      className={cn("nds-chat-thread", className)}
      data-size={size}
      {...props}
    >
      <div
        ref={viewportRef}
        className="nds-chat-thread-viewport"
        // Região rolável alcançável por teclado (WCAG 2.1.1). Fixo, e não prop:
        // torná-lo configurável só criaria o jeito de desligar a única coisa
        // que faz a rolagem existir para quem não usa mouse.
        tabIndex={0}
        // E NOMEADA, que é a outra metade da regra 6 da §8: o foco sozinho
        // fazia uma parada de teclado que o leitor de tela não sabia anunciar.
        // Papel e nome andam juntos — `aria-label` em elemento sem papel é
        // atributo proibido, e o axe acusa `aria-prohibited-attr`.
        //
        // `role="group"` e não `region`: `region` com nome vira marco de
        // página, e a docs page mostra várias conversas — seriam vários marcos
        // homônimos, que é o que torna a lista de regiões do leitor inútil.
        //
        // E não `log` nem `feed`, que é a tentação óbvia numa conversa: os dois
        // trazem semântica viva embutida e passariam a anunciar CADA trecho que
        // chega durante o streaming. Quem anuncia aqui é
        // `.nds-chat-thread-announcer`, uma vez, quando a resposta termina.
        // `group` nomeia sem falar e sem tocar na semântica de lista do `<ol>`
        // que mora dentro.
        role="group"
        aria-label={regionLabel}
        onScroll={handleScroll}
      >
        <ol ref={listRef} className="nds-chat-thread-list">
          {messages.map((message, i) => (
            // A `key` é o id: é ela que faz a mensagem que cresce ser
            // remendada, e não remontada. Remontar tiraria o foco de dentro
            // dela e fecharia um colapsável aberto.
            <Message key={message.id ?? i} message={message} labels={labels} />
          ))}
        </ol>
      </div>

      {/* `role="alert"` — e isto NÃO contradiz a regra de que a conversa não é
          região viva. Aquela é sobre texto em streaming, que chega em cem
          pedaços; isto é uma frase curta e definitiva. Fica FORA da lista
          porque não é um turno: ninguém disse isso. */}
      <p className="nds-chat-thread-error" data-slot="chat-thread-error" role="alert" hidden={!error}>
        {error}
      </p>

      <button
        type="button"
        className="nds-chat-thread-jump nds-button nds-button-secondary nds-button-sm"
        data-slot="chat-thread-jump"
        // Some do percurso do Tab quando não há para onde ir.
        hidden={scroll.atBottom}
        aria-label={jumpLabel}
        onClick={irAoFim}
      >
        {jumpLabel}
      </button>

      {/* A ÚNICA região viva de texto da thread. */}
      <div className="nds-chat-thread-announcer" aria-live="polite" aria-atomic="true">
        {anuncio}
      </div>
    </div>
  )
}

export { ChatThread }
