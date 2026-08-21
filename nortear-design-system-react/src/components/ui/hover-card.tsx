import * as React from "react"
import { PreviewCard as PreviewCardPrimitive } from "@base-ui/react/preview-card"

import { cn } from "@/lib/utils"

// ─── HoverCard ────────────────────────────────────────────────────────────────
//
// Visual: `.nds-hover-card-positioner` e `.nds-hover-card-content`
// (docs/shared/styles/nds/hover-card.css). O gatilho não tem visual próprio —
// é o `<a>`/`<button>` de quem consome, e é ele que precisa continuar clicável:
// o cartão é ENRIQUECIMENTO, nunca o único caminho para a informação.
//
// Duas coisas o `@base-ui/react` NÃO entrega, e são acrescentadas aqui:
//
//  · **os atrasos na RAIZ.** No Base UI `delay`/`closeDelay` moram no Trigger,
//    não no Root — passá-los ao Root, como este arquivo fazia, era silêncio
//    total: a prop era aceita, ignorada, e o cartão usava sempre os 600ms
//    padrão do primitivo. A API pública do design system (e das outras stacks)
//    põe `openDelay`/`closeDelay` na raiz, então o contexto abaixo os leva até
//    o gatilho.
//  · **`role="dialog"` e o NOME ACESSÍVEL do painel.** O primitivo não emite
//    papel nenhum de propósito (trata o preview card como conteúdo
//    suplementar), mas o Vanilla — referência de markup — escreve
//    `role="dialog"`, e é o que as cinco stacks emitem. Sem nome, o axe reprova
//    em `aria-dialog-name`; o nome sai do heading interno quando existe, e do
//    texto do gatilho quando não.
//
// Sem `aria-modal`: a AUSÊNCIA do atributo já significa não-modal, e é o markup
// do Vanilla. Escrever `aria-modal="false"` seria redundância que nenhuma outra
// stack tem.

const ESPERA_PADRAO_ABRIR = 600
const ESPERA_PADRAO_FECHAR = 300

/**
 * O gatilho entra e sai por FUNÇÃO, não por ref exposto no contexto.
 *
 * A forma anterior publicava o próprio `triggerRef` e o gatilho escrevia
 * `contexto.triggerRef.current = el`. Isso é mutação de propriedade de um valor
 * que veio de hook (`useContext` sobre um objeto de `useMemo`), e a regra
 * `react-hooks/immutability` reprova — corretamente: o compilador não tem como
 * saber que aquele campo é um ref, que é a única coisa que o React permite
 * mutar. Era o único erro de lint do repositório, e derrubava o CI do React
 * inteiro.
 *
 * Com um par registrar/ler, quem muta é o dono do ref, dentro do componente
 * que o criou. O consumidor só chama.
 */
type HoverCardContextValue = {
  openDelay: number
  closeDelay: number
  /** Guarda o gatilho deste cartão — é dele que sai o nome acessível do painel. */
  registrarGatilho: (el: HTMLElement | null) => void
  /** Texto do gatilho no momento da leitura, ou `null` se ainda não montou. */
  textoDoGatilho: () => string | null
}

const HoverCardContext = React.createContext<HoverCardContextValue | null>(null)

function useHoverCardContext(): HoverCardContextValue | null {
  return React.useContext(HoverCardContext)
}

type HoverCardProps = PreviewCardPrimitive.Root.Props & {
  /** Espera em ms antes de abrir, no ponteiro e no foco. */
  openDelay?: number
  /** Espera em ms antes de fechar depois que o ponteiro sai. */
  closeDelay?: number
}

function HoverCard({
  openDelay = ESPERA_PADRAO_ABRIR,
  closeDelay = ESPERA_PADRAO_FECHAR,
  ...props
}: HoverCardProps) {
  const triggerRef = React.useRef<HTMLElement | null>(null)
  const registrarGatilho = React.useCallback((el: HTMLElement | null) => {
    triggerRef.current = el
  }, [])
  const textoDoGatilho = React.useCallback(
    () => triggerRef.current?.textContent?.trim() || null,
    []
  )
  const contexto = React.useMemo(
    () => ({ openDelay, closeDelay, registrarGatilho, textoDoGatilho }),
    [openDelay, closeDelay, registrarGatilho, textoDoGatilho]
  )

  return (
    <HoverCardContext.Provider value={contexto}>
      <PreviewCardPrimitive.Root
        data-slot="hover-card"
        {...(props as PreviewCardPrimitive.Root.Props)}
      />
    </HoverCardContext.Provider>
  )
}

type HoverCardTriggerProps = PreviewCardPrimitive.Trigger.Props & {
  asChild?: boolean
  children?: React.ReactNode
}

function HoverCardTrigger({ asChild, children, ...props }: HoverCardTriggerProps) {
  const contexto = useHoverCardContext()

  const registrar = React.useCallback(
    (el: HTMLElement | null) => {
      contexto?.registrarGatilho(el)
    },
    [contexto]
  )

  // `delay`/`closeDelay` são os nomes do primitivo; `openDelay`/`closeDelay`
  // são os do design system. A tradução acontece aqui, uma vez.
  const atrasos = {
    delay: contexto?.openDelay ?? ESPERA_PADRAO_ABRIR,
    closeDelay: contexto?.closeDelay ?? ESPERA_PADRAO_FECHAR,
  }

  if (asChild && React.isValidElement(children)) {
    return (
      <PreviewCardPrimitive.Trigger
        data-slot="hover-card-trigger"
        ref={registrar}
        render={children as React.ReactElement}
        {...atrasos}
        {...(props as PreviewCardPrimitive.Trigger.Props)}
      />
    )
  }
  return (
    <PreviewCardPrimitive.Trigger
      data-slot="hover-card-trigger"
      ref={registrar}
      {...atrasos}
      {...(props as PreviewCardPrimitive.Trigger.Props)}
    >
      {children}
    </PreviewCardPrimitive.Trigger>
  )
}

function HoverCardContent({
  className,
  side = "bottom",
  sideOffset = 4,
  align = "center",
  alignOffset = 4,
  ...props
}: PreviewCardPrimitive.Popup.Props &
  Pick<
    PreviewCardPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset"
  >) {
  const contexto = useHoverCardContext()

  // Nome acessível resolvido quando o painel monta, que é quando ele importa.
  // Sai do rótulo que quem compõe declara e, sem ele, do texto do gatilho — a
  // mesma regra das outras quatro stacks. O gatilho vem do CONTEXTO, e não de
  // uma busca no documento: com quatro cartões na mesma tela (a story Sides),
  // uma busca pelo primeiro `[data-slot="hover-card-trigger"]` daria o mesmo
  // nome aos quatro.
  const nomear = React.useCallback(
    (el: HTMLDivElement | null) => {
      if (!el) return
      if (el.getAttribute("aria-label") || el.getAttribute("aria-labelledby")) return
      el.setAttribute("aria-label", contexto?.textoDoGatilho() || "Prévia")
    },
    [contexto]
  )

  return (
    <PreviewCardPrimitive.Portal data-slot="hover-card-portal">
      <PreviewCardPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        className="nds-hover-card-positioner"
      >
        <PreviewCardPrimitive.Popup
          data-slot="hover-card-content"
          role="dialog"
          ref={nomear}
          className={cn(
            "nds-hover-card-content",
            className
          )}
          {...props}
        />
      </PreviewCardPrimitive.Positioner>
    </PreviewCardPrimitive.Portal>
  )
}

export { HoverCard, HoverCardTrigger, HoverCardContent }
