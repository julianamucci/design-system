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
  /** Observações abaixo do código. */
  footer?: React.ReactNode
  copyLabel?: string
  copiedLabel?: string
}

function CodeBlock({
  code,
  language,
  title,
  showLineNumbers = true,
  highlightLines,
  footer,
  copyLabel = "Copiar código",
  copiedLabel = "Copiado!",
  className,
  ...props
}: CodeBlockProps) {
  const [copied, setCopied] = React.useState(false)

  const lines = React.useMemo(
    () => highlightCode(code, resolveLanguage(language)),
    [code, language],
  )
  const highlighted = React.useMemo(() => parseLineRanges(highlightLines), [highlightLines])

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
      className={cn("nds-code-block-root", className)}
      {...props}
    >
      <div className="nds-code-block-header">
        {title && <span className="nds-code-block-title">{title}</span>}
        <span className="nds-code-block-actions">
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

      <div className="nds-code-block-scroll" tabIndex={0}>
        <pre className="nds-code-block-pre">
          <code className="nds-code-block-code">
            {lines.map((spans, i) => (
              <span
                key={i}
                className="nds-code-block-line"
                data-highlighted={highlighted.has(i + 1) ? "true" : undefined}
              >
                <span className="nds-code-block-gutter" aria-hidden="true">
                  {i + 1}
                </span>
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
