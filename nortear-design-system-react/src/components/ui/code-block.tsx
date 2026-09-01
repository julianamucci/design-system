import * as React from "react"
import { Check, Copy } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { copyText } from "@shared/primitives/clipboard"
import {
  highlightCode,
  parseLineRanges,
  resolveLanguage,
  type LineRangeInput,
} from "@shared/primitives/code-highlight"
import { LABELS_CODE_BLOCK_DEFAULT } from "@shared/primitives/code-block-labels"
import {
  codeLineMarks,
  hasLineKinds,
  type CodeLineKind,
} from "@shared/primitives/code-block-lines"

/**
 * A tokenização vem de `@shared/primitives/code-highlight` (TS puro) e devolve
 * dados, não HTML — cada span vira um nó React, então não há `innerHTML` e nada
 * a sanitizar. Cores, layout e destaque vivem em `nds/code-block.css`.
 */
export interface CodeBlockProps extends Omit<React.ComponentProps<"div">, "children"> {
  /** Código a exibir. É exatamente o que o botão copiar coloca no clipboard. */
  code: string
  /** Linguagem ou extensão (`tsx`, `vue`, `.css`, `bash`). Desconhecida → sem cor. */
  language?: string
  /** Rótulo do header, normalmente o nome do arquivo. */
  title?: string
  /** Numeração de linha. */
  showLineNumbers?: boolean
  /** Linhas destacadas: `[3, "5-7"]` ou `"3, 5-7"`. */
  highlightLines?: LineRangeInput
  /**
   * Espécie de cada linha, indexada a partir da primeira.
   *
   * Ligada, a calha troca o número pela marca `+`/`−` e deixa de ser
   * `aria-hidden`. Indexada por linha, e não por intervalo como
   * `highlightLines`: destaque é decoração esparsa, espécie é classificação
   * completa — ver `@shared/primitives/code-block-lines`.
   */
  lineKinds?: ReadonlyArray<CodeLineKind>
  /**
   * Controles de quem compõe, no cabeçalho.
   *
   * Entram ANTES do copiar, e a ordem é decisão de acessibilidade, não de
   * gosto: a fila é encostada no fim do cabeçalho, então acrescentar do lado de
   * dentro deixa o copiar ancorado no canto do bloco em toda composição. Quem
   * aprendeu que copiar é o último controle do cabeçalho continua com essa
   * verdade quando a composição acrescenta executar, alternar ou baixar (WCAG
   * 3.2.4, identificação consistente). O rótulo "Copiado!" fica colado ao botão
   * que ele descreve pelo mesmo motivo, e a ordem de foco segue a visual.
   */
  actions?: React.ReactNode
  /** Observações abaixo do código. */
  footer?: React.ReactNode
  copyLabel?: string
  copiedLabel?: string
  /**
   * Palavra que o leitor recebe na calha de uma linha adicionada.
   *
   * Existe pelo mesmo motivo de `copyLabel`: é texto falado, e texto falado que
   * quem consome não possa trocar decide o idioma do produto pelo componente.
   */
  addedLabel?: string
  /** Palavra que o leitor recebe na calha de uma linha removida. */
  removedLabel?: string
  /**
   * Nome acessível da região que rola.
   *
   * A região tem `tabIndex={0}` porque quem navega por teclado precisa alcançar
   * o código que passa da altura máxima; com nome ela deixa de ser uma parada
   * anônima. Distinga quando houver mais de um bloco na mesma tela.
   */
  regionLabel?: string
}

function CodeBlock({
  code,
  language,
  title,
  showLineNumbers = true,
  highlightLines,
  lineKinds,
  actions,
  footer,
  copyLabel = LABELS_CODE_BLOCK_DEFAULT.copy,
  copiedLabel = LABELS_CODE_BLOCK_DEFAULT.copied,
  addedLabel = LABELS_CODE_BLOCK_DEFAULT.lineAdded,
  removedLabel = LABELS_CODE_BLOCK_DEFAULT.lineRemoved,
  regionLabel = LABELS_CODE_BLOCK_DEFAULT.region,
  className,
  ...props
}: CodeBlockProps) {
  const [copied, setCopied] = React.useState(false)

  // A linguagem RESOLVIDA, não a recebida: `.css` e `css` são a mesma coisa, e
  // um valor desconhecido vira `text`. É o que a raiz registra e o que story,
  // teste e devtools leem — sem isto, "caiu em texto simples" não é observável.
  const resolvedLanguage = React.useMemo(() => resolveLanguage(language), [language])

  const lines = React.useMemo(
    () => highlightCode(code, resolvedLanguage),
    [code, resolvedLanguage],
  )
  const highlighted = React.useMemo(() => parseLineRanges(highlightLines), [highlightLines])

  const marks = React.useMemo(
    () =>
      codeLineMarks(lineKinds, lines.length, {
        ...LABELS_CODE_BLOCK_DEFAULT,
        lineAdded: addedLabel,
        lineRemoved: removedLabel,
      }),
    [lineKinds, lines.length, addedLabel, removedLabel],
  )
  const kindMode = hasLineKinds(lineKinds)

  // Limpa o timer no unmount: sem isso, desmontar dentro dos 2s faz o setState
  // cair num componente que não existe mais.
  const timerRef = React.useRef<number | undefined>(undefined)
  React.useEffect(() => () => window.clearTimeout(timerRef.current), [])

  const handleCopy = React.useCallback(async () => {
    // copyText já cobre o fallback fora de contexto seguro; false = não copiou,
    // e nesse caso não confirmamos nada.
    if (!(await copyText(code))) return
    setCopied(true)
    window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => setCopied(false), 2000)
  }, [code])

  return (
    <div
      data-slot="code-block"
      data-numbered={showLineNumbers ? "true" : "false"}
      // A folha precisa saber que a calha mudou de conteúdo: sem numeração ela
      // some, mas a marca `+`/`−` não pode sumir com ela.
      data-line-kinds={kindMode ? "true" : undefined}
      data-language={resolvedLanguage}
      className={cn("nds-code-block-root", className)}
      {...props}
    >
      <div className="nds-code-block-header">
        {title && <span className="nds-code-block-title">{title}</span>}
        <span className="nds-code-block-actions">
          {actions}
          {copied && (
            <span className="nds-code-block-copy-label" aria-hidden="true">
              {copiedLabel}
            </span>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={handleCopy}
            aria-label={copied ? copiedLabel : copyLabel}
            data-slot="code-block-copy"
          >
            {copied ? (
              <Check className="nds-icon" aria-hidden="true" />
            ) : (
              <Copy className="nds-icon" aria-hidden="true" />
            )}
          </Button>
        </span>
      </div>

      {/* aria-live fora do botão: leitor de tela anuncia a confirmação sem que o
          rótulo do botão mude no meio da interação. */}
      <span className="nds-sr-only" role="status" aria-live="polite">
        {copied ? copiedLabel : ""}
      </span>

      {/* Região rolável alcançável por teclado (WCAG 2.1.1), COM papel e nome —
          a regra 6 da §8 da guideline 17 pede os dois, e `tabIndex` sozinho
          fazia uma parada de foco que o leitor de tela não sabia nomear.

          `group` e não `region`: `region` com nome vira landmark, e uma página
          de documentação tem dezenas de blocos — seriam dezenas de entradas de
          mesmo papel e mesmo nome na lista de regiões do leitor, que é o que o
          docblock da `scroll-area` já avisa que torna a lista inútil. `group`
          nomeia sem entrar em lista nenhuma. */}
      <div className="nds-code-block-scroll" role="group" aria-label={regionLabel} tabIndex={0}>
        {/* lang="en": o conteúdo é código — identificador e palavra reservada.
            Sem isto, a voz do leitor de tela em pt-BR tenta pronunciá-lo como
            português. WCAG 3.1.2. */}
        <pre className="nds-code-block-pre" lang="en">
          <code className="nds-code-block-code">
            {lines.map((spans, i) => (
              <span
                key={i}
                className="nds-code-block-line"
                data-highlighted={highlighted.has(i + 1) ? "true" : undefined}
                data-kind={marks[i]?.kind}
              >
                {/* Sem `aria-hidden` no modo de espécie, e é a diferença que
                    importa: número de linha é redundante com a posição e sai da
                    leitura; sinal de adição e remoção é o único portador
                    não-cromático da distinção e não é redundante com nada. */}
                {marks[i] ? (
                  <span className="nds-code-block-gutter">
                    {marks[i].mark}
                    {marks[i].label && <span className="nds-sr-only">{marks[i].label}</span>}
                  </span>
                ) : (
                  <span className="nds-code-block-gutter" aria-hidden="true">
                    {i + 1}
                  </span>
                )}
                <span className="nds-code-block-text">
                  {spans.map((span, j) =>
                    span.token === "plain" ? (
                      span.text
                    ) : (
                      <span key={j} data-token={span.token}>
                        {span.text}
                      </span>
                    ),
                  )}
                  {/* Linha vazia precisa de altura: sem isto ela colapsa. */}
                  {spans.length === 0 && "\n"}
                </span>
              </span>
            ))}
          </code>
        </pre>
      </div>

      {footer && <div className="nds-code-block-footer">{footer}</div>}
    </div>
  )
}

export { CodeBlock }
