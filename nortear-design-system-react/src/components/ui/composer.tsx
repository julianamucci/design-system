import * as React from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  ComposerAttachments,
  type ComposerAttachmentLabels,
} from "@/components/ui/composer-attachments"
import {
  ComposerTriggerPopover,
  useComposerTrigger,
  type TriggerPopoverLabels,
  type TriggerSource,
} from "@/components/ui/composer-trigger-popover"
import type { Attachment } from "@shared/primitives/chat-protocol"

/**
 * A superfície de entrada da conversa. Estrutura e cores em `nds/composer.css`,
 * que também guarda as decisões de acessibilidade que valem mais que o desenho.
 *
 * O QUE O COMPONENTE FAZ: recebe o que foi escrito, diz quando alguém pediu
 * para enviar, e troca o botão de enviar por um de interromper enquanto a
 * resposta é gerada.
 *
 * O QUE ELE NÃO FAZ: decidir o que enviar significa. Ele não limpa o campo
 * sozinho, não sabe se a mensagem chegou e não guarda rascunho. Emite o texto e
 * devolve o controle — a mesma divisão de `approval` no `chat-thread`, e pelo
 * mesmo motivo: o que acontece depois do envio é produto, e produto envelhece
 * por outro relógio que o sistema de design.
 *
 * POR QUE `Enter` ENVIA, e por que isso é uma prop
 *
 * A convenção de conversa em teclado físico é Enter enviar e Shift+Enter
 * quebrar linha, e é o padrão daqui. Mas ela é ERRADA no toque: no teclado
 * virtual o Enter é a tecla de quebrar linha, e um composer que envia ali
 * manda mensagem pela metade a cada tentativa de fazer parágrafo. Por isso
 * `submitOn` existe.
 *
 * A dica embaixo NÃO é decoração: `Enter envia` é comportamento, e quem não vê
 * a tela precisa saber disso ANTES de apertar a tecla. Ela entra em
 * `aria-describedby` do campo, junto com o limite de caracteres.
 *
 * A API DIVERGE do Vanilla, e é assim que tem de ser. Lá a raiz expõe
 * `setRunning(booleano)` e `setValue(texto)`, porque não há outro caminho: sem
 * renderização declarativa, mexer no estado é mexer no elemento. Aqui:
 *
 *   - `running` é PROP. Quem sabe se a resposta está sendo gerada é quem
 *     consome, e nesta stack esse saber já é estado dele — chamar um método
 *     para contá-lo criaria uma segunda cópia da mesma verdade, que dessincroniza
 *     no primeiro re-render.
 *   - `railStart` é NÓ, e não lista de elementos. Elemento pronto é o que se
 *     passa numa stack sem renderizador; aqui o que se passa é marcação.
 *   - `value` é a semente do campo. Com `onValueChange`, quem consome passa a
 *     controlar o texto — que é o `setValue` do Vanilla escrito do jeito
 *     idiomático daqui, e o único que sobrevive a um re-render.
 *
 * O que NÃO diverge é o contrato de comportamento: o componente continua não
 * limpando o campo, não sabendo se a mensagem chegou e emitindo só o texto sem
 * espaços nas pontas.
 */

/** Como se pede o envio pelo teclado. */
export type ComposerSubmitOn =
  /** Enter envia; Shift+Enter quebra linha. Convenção de teclado físico. */
  | "enter"
  /** Ctrl/Cmd+Enter envia; Enter quebra linha. É o certo no toque. */
  | "modifier"

export interface ComposerLabels {
  /** Nome acessível do campo. */
  input: string
  placeholder: string
  /** Nome do botão em repouso. */
  submit: string
  /** Nome do MESMO botão enquanto gera — troca de nome, não só de ícone. */
  stop: string
  /** A dica de teclado. `{key}` vira a combinação que envia. */
  hint: string
  /** Descrição do limite. `{max}` vira o número. */
  limit: string
}

export interface ComposerProps
  extends Omit<React.ComponentProps<"form">, "onSubmit" | "children"> {
  labels: ComposerLabels
  /**
   * O texto do campo. Sozinho é semente; acompanhado de `onValueChange`, é
   * quem consome que passa a mandar. O componente não guarda rascunho.
   */
  value?: string
  /** Linhas visíveis em repouso. É contagem de linha, então acompanha a fonte. */
  rows?: number
  /** Limite de caracteres. Sem ele não há contador: contar sem teto não informa nada. */
  maxLength?: number
  disabled?: boolean
  submitOn?: ComposerSubmitOn
  /** A resposta está sendo gerada? Quem sabe é quem consome. */
  running?: boolean
  /** Controles do início do trilho — anexar, ferramentas. É um ESPAÇO. */
  railStart?: React.ReactNode
  /**
   * Gatilhos do seletor — menções, comandos, e qualquer outro caractere.
   *
   * Sem eles o campo é só um campo. Com eles, digitar o caractere abre o
   * seletor, e a tecla de envio passa a ESCOLHER enquanto ele estiver aberto.
   */
  triggers?: TriggerSource[]
  /** Textos do seletor. Obrigatórios quando há gatilho, porque são texto de tela. */
  triggerLabels?: TriggerPopoverLabels
  /**
   * Os arquivos que vão junto com a mensagem.
   *
   * O composer os DESENHA e avisa quando alguém pede para remover; subir,
   * validar e remover de verdade é de quem consome.
   */
  attachments?: Attachment[]
  /** Textos da fila de anexos. Obrigatórios quando há anexo. */
  attachmentLabels?: ComposerAttachmentLabels
  /** Alguém pediu para remover um anexo. */
  onRemoveAttachment?: (attachment: Attachment) => void
  /** Alguém pediu para enviar. O texto vai junto; limpar o campo é de quem consome. */
  onSubmit?: (value: string) => void
  /** Alguém pediu para interromper o que está sendo gerado. */
  onStop?: () => void
  /** O texto mudou. Passá-lo é o que torna o campo controlado. */
  onValueChange?: (value: string) => void
}

/** A combinação que envia, para a dica dizer a verdade em cada modo. */
function submitKey(submitOn: ComposerSubmitOn): string {
  return submitOn === "enter" ? "Enter" : "Ctrl+Enter"
}

/** O evento de teclado pede envio? */
function asksToSubmit(
  event: React.KeyboardEvent<HTMLTextAreaElement>,
  submitOn: ComposerSubmitOn,
): boolean {
  if (event.key !== "Enter") return false
  // Composição de IME (acento morto, teclado de idioma com candidatos) usa
  // Enter para CONFIRMAR o caractere. Enviar aqui interromperia quem está
  // escrevendo em japonês no meio de uma palavra — e o campo é multilíngue.
  if (event.nativeEvent.isComposing) return false
  if (submitOn === "modifier") return event.ctrlKey || event.metaKey
  return !event.shiftKey
}

function Composer({
  labels,
  value,
  rows = 2,
  maxLength,
  disabled = false,
  submitOn = "enter",
  running = false,
  railStart,
  triggers,
  triggerLabels,
  attachments,
  attachmentLabels,
  onRemoveAttachment,
  onSubmit,
  onStop,
  onValueChange,
  className,
  ...props
}: ComposerProps) {
  const fieldId = React.useId()
  const hintId = `${fieldId}-hint`

  // Semente ou controle, e a diferença é `onValueChange`: sem ele o campo
  // guarda o próprio texto e `value` só diz por onde começar; com ele, o que
  // aparece na tela é sempre o que quem consome mandou aparecer.
  const [draft, setDraft] = React.useState(value ?? "")
  const controlled = value !== undefined && onValueChange !== undefined
  const text = controlled ? value : draft

  const inputRef = React.useRef<HTMLTextAreaElement>(null)

  const write = (next: string) => {
    if (!controlled) setDraft(next)
    onValueChange?.(next)
  }

  // ── O seletor do caractere gatilho ─────────────────────────────────────────
  //
  // Só desenha painel quando há gatilho declarado E texto para ele dizer. Sem
  // rótulo o painel abriria com a frase de nenhum resultado em branco, que é
  // pior que não abrir. O estado, esse, existe sempre: um hook não pode ser
  // condicional, e sem gatilho ele nunca chega a abrir.
  const sources = triggers ?? []
  const hasTrigger = sources.length > 0 && triggerLabels !== undefined

  /**
   * Onde o cursor deve parar depois da escolha.
   *
   * Aqui o campo é controlado, então escrever é agendar um render — e mexer no
   * cursor antes dele seria mexer no texto antigo. A posição espera numa
   * referência e é aplicada quando o texto novo já está na tela.
   */
  const caretRef = React.useRef<number | null>(null)

  const trigger = useComposerTrigger({
    inputRef,
    sources,
    onApply: (next, caret) => {
      caretRef.current = caret
      write(next)
    },
  })

  React.useLayoutEffect(() => {
    const caret = caretRef.current
    if (caret === null) return
    caretRef.current = null
    inputRef.current?.setSelectionRange(caret, caret)
  })

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    write(event.target.value)
    trigger.sync()
  }

  const submit = () => {
    const trimmed = text.trim()
    if (!trimmed || running || disabled) return
    onSubmit?.(trimmed)
  }

  const keyboardHint = labels.hint.replace("{key}", submitKey(submitOn))
  const hint =
    maxLength === undefined
      ? keyboardHint
      : `${keyboardHint} · ${labels.limit.replace("{max}", String(maxLength))}`

  return (
    <form
      data-slot="composer"
      data-state={running ? "running" : "idle"}
      data-disabled={disabled ? "true" : undefined}
      className={cn("nds-composer", className)}
      onSubmit={(event) => {
        // O composer não navega: quem decide o que fazer com o texto é quem
        // consome.
        event.preventDefault()
        submit()
      }}
      {...props}
    >
      {/* A moldura é do CONJUNTO: o campo perde borda, fundo e anel, e o anel
          acende no `:focus-within` daqui — o trilho está dentro do mesmo
          formulário e faz parte do que está em foco. */}
      <div className="nds-composer-field">
        {/* A fila vem ANTES do campo e DENTRO da moldura: os anexos fazem
            parte do que está sendo escrito, e fora da moldura pareceriam uma
            lista de outra coisa. Sem anexo ela não existe no documento — uma
            lista vazia seria anunciada como "lista com zero itens", que promete
            algo que não há. */}
        {attachments?.length && attachmentLabels ? (
          <ComposerAttachments
            attachments={attachments}
            labels={attachmentLabels}
            onRemove={onRemoveAttachment}
          />
        ) : null}
        <textarea
          id={fieldId}
          ref={inputRef}
          data-slot="composer-input"
          className="nds-composer-input"
          rows={rows}
          value={text}
          placeholder={labels.placeholder}
          // O marca-lugar some na primeira letra digitada. Um campo cujo nome
          // era o marca-lugar fica sem nome exatamente quando passa a ter
          // conteúdo.
          aria-label={labels.input}
          // A dica descreve o campo — `Enter envia` é comportamento, e saber
          // disso depois de apertar a tecla não serve para nada.
          aria-describedby={hintId}
          // O campo aponta a lista só enquanto ela existe para ele. Um
          // `aria-controls` para um painel escondido promete uma lista que não
          // há, e um `aria-activedescendant` órfão aponta um elemento que já
          // saiu do documento.
          aria-controls={hasTrigger && trigger.open ? trigger.listId : undefined}
          aria-activedescendant={hasTrigger ? trigger.activeOptionId : undefined}
          maxLength={maxLength}
          disabled={disabled}
          onChange={handleChange}
          onKeyDown={(event) => {
            // COM O SELETOR ABERTO, AS TECLAS SÃO DELE.
            //
            // É a decisão que atravessa o componente inteiro: envio e escolha
            // disputam a mesma tecla, e enviar no meio de uma menção é o
            // defeito que quem escreve encontra na primeira vez que usa. As
            // setas e o Escape também param aqui — sem isso a seta moveria o
            // cursor no texto enquanto a lista parece andar.
            if (hasTrigger && trigger.isOpen()) {
              if (event.key === "ArrowDown") {
                event.preventDefault()
                trigger.move(1)
                return
              }
              if (event.key === "ArrowUp") {
                event.preventDefault()
                trigger.move(-1)
                return
              }
              if (event.key === "Escape") {
                event.preventDefault()
                trigger.close()
                return
              }
              // Enter e Tab escolhem. O Tab entra porque quem escreve espera
              // que ele complete, e sem isso ele tiraria o foco do campo com a
              // lista aberta.
              if (
                (event.key === "Enter" && !event.nativeEvent.isComposing) ||
                event.key === "Tab"
              ) {
                if (trigger.applyActive()) {
                  event.preventDefault()
                  return
                }
              }
            }

            if (!asksToSubmit(event, submitOn)) return
            // Só aqui: sem o `preventDefault` a quebra de linha entra junto
            // com o envio, e o campo fica com um enter sobrando depois de
            // limpo.
            event.preventDefault()
            submit()
          }}
          // O clique e as setas movem o cursor sem disparar mudança de texto, e
          // o gatilho depende de ONDE o cursor está: sem isto o seletor
          // continuaria aberto sobre um caractere que ficou para trás.
          onClick={() => trigger.sync()}
          onKeyUp={(event) => {
            if (
              event.key.startsWith("Arrow") ||
              event.key === "Home" ||
              event.key === "End"
            ) {
              trigger.sync()
            }
          }}
          onBlur={() => trigger.close()}
        />
        {hasTrigger ? (
          <ComposerTriggerPopover controller={trigger} labels={triggerLabels} />
        ) : null}
      </div>

      <div className="nds-composer-rail">
        <div className="nds-composer-rail-start">{railStart}</div>
        <div className="nds-composer-rail-end">
          {/*
            O contador é `aria-hidden`, e isso é decisão, não esquecimento.

            Ele muda a cada tecla. Num leitor de tela isso vira um número
            reanunciado a cada letra, e o campo fica impossível de usar. O
            limite chega UMA vez, pela descrição do campo, que é texto estático.
          */}
          {maxLength === undefined ? null : (
            <span
              className="nds-composer-counter"
              aria-hidden="true"
              // Perto do limite muda cor E peso — cor sozinha não descreve
              // estado.
              data-near-limit={String(text.length >= maxLength * 0.9)}
            >
              {text.length}/{maxLength}
            </span>
          )}
          <Button
            data-slot="composer-submit"
            size="sm"
            // O botão troca de NOME, e não só de ícone: é o mesmo controle
            // fazendo outra coisa, e o nome acessível tem de dizer qual.
            type={running ? "button" : "submit"}
            // Vazio não envia. Enquanto gera, o botão continua vivo — é ele
            // que interrompe.
            disabled={disabled || (!running && text.trim() === "")}
            onClick={running ? () => onStop?.() : undefined}
          >
            {running ? labels.stop : labels.submit}
          </Button>
        </div>
      </div>

      <p className="nds-composer-hint" id={hintId}>
        {hint}
      </p>
    </form>
  )
}

export { Composer }
