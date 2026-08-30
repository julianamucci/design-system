import * as React from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

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

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const next = event.target.value
    if (!controlled) setDraft(next)
    onValueChange?.(next)
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
        <textarea
          id={fieldId}
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
          maxLength={maxLength}
          disabled={disabled}
          onChange={handleChange}
          onKeyDown={(event) => {
            if (!asksToSubmit(event, submitOn)) return
            // Só aqui: sem o `preventDefault` a quebra de linha entra junto
            // com o envio, e o campo fica com um enter sobrando depois de
            // limpo.
            event.preventDefault()
            submit()
          }}
        />
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
