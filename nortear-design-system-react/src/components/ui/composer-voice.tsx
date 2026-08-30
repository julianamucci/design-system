import * as React from "react"
import { Mic } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { isVoiceBusy, type VoiceState } from "@shared/primitives/chat-protocol"

/**
 * O controle do trilho que escreve por quem fala.
 *
 * Desenho em `nds/composer.css`, no bloco de ditado por voz, que também guarda
 * as quatro decisões de acessibilidade. O vocabulário — `VoiceState`,
 * `isVoiceBusy` — vem de `@shared/primitives/chat-protocol`.
 *
 * A DECISÃO QUE GOVERNA A PEÇA: o componente NÃO capta áudio. Permissão de
 * microfone, captura, transcrição e o destino do texto são de quem consome. Ele
 * desenha o estado que recebe e avisa que alguém pediu para começar ou parar —
 * a mesma divisão de `approval` no `chat-thread` e de `onRemove` nos anexos.
 * Um ditado que pedisse permissão sozinho traria política de produto junto, e
 * política envelhece por produto, não por sistema.
 *
 * O MEDIDOR É DECORATIVO E O ESTADO É TEXTO. O nível é um número de 0 a 1 que
 * desenha e não se anuncia; o tempo decorrido é texto na tela e fica fora do
 * que é lido em voz. É a mesma decisão do contador de caracteres e do relógio
 * do reprodutor de mídia: número que muda a cada quadro, anunciado, torna a
 * tela impossível de ouvir. Quem ouve recebe a PALAVRA do estado.
 *
 * A PEÇA É AUTÔNOMA: o campo não sabe que ela existe. Quem consome a põe no
 * `railStart`, do mesmo jeito que poria qualquer outro controle do trilho.
 *
 * DIVERGÊNCIA DE API, e só de forma: aqui o aviso sai por `onToggle`, uma
 * propriedade de retorno, porque é assim que este renderizador o escreve. O
 * nome, o argumento e o momento são os mesmos das outras stacks; o que muda é
 * o portador. O nível também: ele entra por custom property num `style` — a
 * mesma custom property que a folha lê —, e não por `setProperty`, porque aqui
 * não há nó imperativo em que chamá-lo.
 */

/**
 * Quantas barras o medidor desenha.
 *
 * É DESENHO, e por isso constante e não prop: a folha declara `gap` entre as
 * barras, e o número delas é o que faz o conjunto ler como medidor em vez de
 * como um traço solto. Quem consome escolhe o nível, não a forma.
 */
const LEVEL_BAR_COUNT = 5

/**
 * O pedido que sai do alternador.
 *
 * É INTENÇÃO, e não o estado seguinte. Entre pedir para começar e estar
 * captando existe uma permissão que pode demorar ou ser negada, e um componente
 * que anunciasse `recording` estaria adivinhando o que ainda não aconteceu.
 */
export type ComposerVoiceIntent = "start" | "stop"

export interface ComposerVoiceLabels {
  /** Nome do alternador em repouso — o que a pessoa vai fazer ao acioná-lo. */
  start: string
  /** Nome do MESMO botão enquanto o ditado ocupa. Troca de nome, não só de desenho. */
  stop: string
  /**
   * A palavra de cada estado. É ela que chega a quem não vê o medidor, e é
   * nela que vai o motivo de o alternador não responder na transcrição.
   */
  status: Record<VoiceState, string>
}

export interface ComposerVoiceProps {
  labels: ComposerVoiceLabels
  /** Em que ponto o ditado está. Quem capta é quem sabe, e é quem passa. */
  state?: VoiceState
  /** O som que entra, de 0 a 1. É desenho, e não se anuncia. */
  level?: number
  /**
   * Há quanto tempo a captura corre, JÁ ESCRITO.
   *
   * String, e não segundos: formato de duração é decisão de idioma, e um
   * componente que o formatasse decidiria idioma em cinco lugares diferentes.
   */
  elapsed?: string
  /** Ditar não está disponível agora. Na transcrição já se desabilita sozinho. */
  disabled?: boolean
  /** Alguém pediu para começar ou parar. Começar de verdade é de quem capta. */
  onToggle?: (intent: ComposerVoiceIntent) => void
  className?: string
}

/** O nível, aparado na faixa que o desenho aceita. */
function clampLevel(level: number | undefined): number | undefined {
  if (level === undefined || Number.isNaN(level)) return undefined
  return Math.min(1, Math.max(0, level))
}

function ComposerVoice({
  labels,
  state = "idle",
  level,
  elapsed,
  disabled = false,
  onToggle,
  className,
}: ComposerVoiceProps) {
  const id = React.useId()
  const statusId = `${id}-status`

  const busy = isVoiceBusy(state)
  const clamped = clampLevel(level)

  return (
    <div
      data-slot="composer-voice"
      data-state={state}
      className={cn("nds-composer-voice", className)}
    >
      {/*
        O ALTERNADOR.

        UM botão que muda de estado, e não dois que se trocam (decisão 1 da
        folha): botão que some leva o foco junto, e quem estava nele é despejado
        no meio da tela. `aria-pressed` é o que carrega a diferença, e
        `isVoiceBusy` é quem a decide — a mesma máquina nas cinco stacks, em vez
        de cinco `if`.

        O nome acompanha o estado: nome acessível é o NOME, e não o ícone (regra
        7 da guideline 17). O ícone é o mesmo nos três estados, de propósito —
        estado nunca é só desenho.
      */}
      <Button
        data-slot="composer-voice-toggle"
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-pressed={busy}
        aria-label={busy ? labels.stop : labels.start}
        // A descrição aponta o texto de estado, que é onde o motivo de o botão
        // não responder está escrito. Sem isso, quem chega pelo teclado
        // encontra um botão apagado e nenhuma explicação na tela.
        aria-describedby={statusId}
        // `transcribing` DESABILITA (decisão 2 da folha): já parou de captar, e
        // apertar ali não devolve o áudio. O motivo vai no texto de estado,
        // nunca só no cinza do botão.
        disabled={disabled || state === "transcribing"}
        onClick={() => onToggle?.(busy ? "stop" : "start")}
      >
        <Mic aria-hidden="true" />
      </Button>

      {/*
        O MEDIDOR.

        Só existe enquanto há som entrando: medidor parado ao lado de um ditado
        desligado é medidor mentindo. Ele é `aria-hidden` inteiro — o que muda a
        cada quadro, anunciado, cobre tudo o mais que houvesse para ouvir.
      */}
      {state === "recording" ? (
        <span
          className="nds-composer-voice-level"
          data-slot="composer-voice-level"
          aria-hidden="true"
          // O nível é valor de RUNTIME, e entra por custom property — nunca por
          // um `style` de desenho, que sairia do tema junto com a densidade e a
          // escala tipográfica. Mesma mecânica de `--nds-attachment-progress`
          // na fila de anexos. Ele é declarado UMA vez, no container, e as
          // barras herdam.
          style={
            clamped === undefined
              ? undefined
              : ({ "--nds-voice-level": String(clamped) } as React.CSSProperties)
          }
        >
          {Array.from({ length: LEVEL_BAR_COUNT }, (_, index) => (
            <span key={index} className="nds-composer-voice-bar" />
          ))}
        </span>
      ) : null}

      {/*
        O ESTADO, EM PALAVRA.

        Ele NÃO é região viva. O estado muda por ação de quem usa ou por decisão
        de quem consome, e o alternador — que tem o foco quando isso acontece —
        já anuncia a troca por `aria-pressed` e pelo nome. Uma região viva aqui
        reanunciaria o texto inteiro a cada mudança de nível.
      */}
      <span
        className="nds-composer-voice-status"
        data-slot="composer-voice-status"
        id={statusId}
      >
        {labels.status[state]}

        {/*
          O TEMPO DECORRIDO É O ÚNICO PEDAÇO ESCONDIDO DA VOZ.

          Ele fica dentro do texto de estado para ser lido junto na tela, e sai
          do que é anunciado por `aria-hidden`: cronômetro ao vivo não se
          anuncia (regra 9 da guideline 17), e é o defeito que o reprodutor de
          mídia já pagou nesta base. Como a descrição do alternador aponta para
          este mesmo elemento, o relógio ficaria colado no nome do botão a cada
          foco se não estivesse fora.

          O `<span>` sem classe é ESTRUTURA, e não desenho: ele herda tudo do
          pai e não pede nada da folha.
        */}
        {elapsed ? (
          <span data-slot="composer-voice-elapsed" aria-hidden="true">
            {` · ${elapsed}`}
          </span>
        ) : null}
      </span>
    </div>
  )
}

export { ComposerVoice }
