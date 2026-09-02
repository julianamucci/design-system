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
//  · **a ASSOCIAÇÃO entre gatilho e painel.** O primitivo não emite papel nem
//    relação nenhuma no preview card (medido em `node_modules`: nem o Popup nem
//    o Trigger escrevem `role` ou `aria-*`), e é o design system que decide os
//    dois. O painel recebe um `id`; o gatilho o aponta por `aria-describedby`
//    enquanto o cartão está aberto.
//
// ─── Acessibilidade: o cartão é enriquecimento, e o teclado não entra nele ──
//
// Abre por PONTEIRO e por FOCO, fecha no `blur` do gatilho e não move o foco
// para o painel — então um Tab a partir do gatilho fecha o cartão antes de
// alcançar o que houver dentro. Conteúdo interativo no painel é inalcançável
// por teclado, e isso vale nas cinco stacks: é a forma do gesto, não defeito de
// uma delas. Daí as três regras — nada de ação, link ou campo no painel; o
// gatilho continua sendo o caminho; abrir por foco é obrigatório.
//
// **Descrição sim, papel não** (decisão de 2026-09-02, que INVERTE a anterior).
// O painel era `role="dialog"` nomeado pelo gatilho, e o gatilho não apontava
// para ele — para não anunciar a mesma coisa duas vezes. O argumento estava
// certo e resolvia o problema errado: a duplicação vinha de o painel ser um
// diálogo homônimo, e isso era escolha nossa. Medido, o defeito era outro — com
// o cartão ABERTO na tela, o leitor anunciava só o gatilho, porque nada leva o
// foco ao painel e o `blur` fecha o cartão. Agora o painel não tem papel, e o
// gatilho o DESCREVE.
//
//  · GANHA-SE o anúncio do conteúdo, no foco do gatilho;
//  · PERDE-SE o painel como nó com papel próprio na árvore — não há mais
//    "diálogo" para listar ou navegar.
//
// O painel também não tem nome próprio: `aria-label` em elemento sem papel é
// `aria-prohibited-attr` no axe, então o nome saiu junto com o papel em vez de
// sobrar apontando para nada. `aria-labelledby` no gatilho continua fora
// (trocaria o nome do link pelo do cartão), e `aria-describedby` só existe
// enquanto o painel existe — escrito na montagem seria `aria-valid-attr-value`.
//
// **Mecanismo desta stack** (medido em `node_modules`): o gatilho combina
// `useHoverReferenceInteraction` (`mouseOnly`, com `safePolygon()` fazendo a
// ponte de tolerância até o painel) e `useFocus`, que só abre em
// `:focus-visible` — foco programático NÃO abre, e é por isso que a play usa
// `userEvent.tab()` e não `.focus()`. O Escape vem do `useDismiss` da raiz.
//
// Bloco canônico, com a comparação contra tooltip e popover e as três condições
// da WCAG 1.4.13: `hover-card.ts` do Vanilla.

const WAIT_DEFAULT_OPEN = 600
const WAIT_DEFAULT_CLOSE = 300

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
  /** Guarda o gatilho deste cartão — é nele que a descrição do painel é escrita. */
  registrarTrigger: (el: HTMLElement | null) => void
  /** O gatilho no momento da leitura, ou `null` se ainda não montou. */
  triggerEl: () => HTMLElement | null
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
  openDelay = WAIT_DEFAULT_OPEN,
  closeDelay = WAIT_DEFAULT_CLOSE,
  ...props
}: HoverCardProps) {
  const triggerRef = React.useRef<HTMLElement | null>(null)
  const registrarTrigger = React.useCallback((el: HTMLElement | null) => {
    triggerRef.current = el
  }, [])
  const triggerEl = React.useCallback(() => triggerRef.current, [])
  const contexto = React.useMemo(
    () => ({ openDelay, closeDelay, registrarTrigger, triggerEl }),
    [openDelay, closeDelay, registrarTrigger, triggerEl]
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
      contexto?.registrarTrigger(el)
    },
    [contexto]
  )

  // `delay`/`closeDelay` são os nomes do primitivo; `openDelay`/`closeDelay`
  // são os do design system. A tradução acontece aqui, uma vez.
  const atrasos = {
    delay: contexto?.openDelay ?? WAIT_DEFAULT_OPEN,
    closeDelay: contexto?.closeDelay ?? WAIT_DEFAULT_CLOSE,
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

  const panelId = React.useId()

  // A associação é escrita quando o painel MONTA e desfeita quando ele
  // desmonta — que é exatamente a janela em que o alvo existe no documento.
  // Não dá para pôr `aria-describedby` no gatilho por prop: fechado, ele
  // apontaria para um `id` ausente, e isso é `aria-valid-attr-value` no axe.
  //
  // O gatilho vem do CONTEXTO, e não de uma busca no documento: com quatro
  // cartões na mesma tela (a story Sides), uma busca pelo primeiro
  // `[data-slot="hover-card-trigger"]` descreveria sempre o mesmo gatilho.
  //
  // O ref guarda o gatilho de quando a associação foi feita: na desmontagem o
  // contexto pode já ter sido esvaziado, e é neste elemento — não em outro —
  // que o atributo precisa ser apagado.
  const describedTrigger = React.useRef<HTMLElement | null>(null)
  const associate = React.useCallback(
    (el: HTMLDivElement | null) => {
      if (el) {
        const trigger = contexto?.triggerEl() ?? null
        describedTrigger.current = trigger
        trigger?.setAttribute("aria-describedby", el.id)
        return
      }
      describedTrigger.current?.removeAttribute("aria-describedby")
      describedTrigger.current = null
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
          id={panelId}
          ref={associate}
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
