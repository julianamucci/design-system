import * as React from "react"
import { Dialog as SheetPrimitive } from "@base-ui/react/dialog"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { XIcon } from "lucide-react"

// Decisão de acessibilidade do Sheet — bloco canônico no sheet.ts do Vanilla.
// Em resumo: painel modal que entra pela borda, com role="dialog",
// aria-modal="true", foco preso, foco devolvido ao gatilho no fecho, Escape e
// clique no véu fechando, rolagem da página travada, corpo rolável com papel e
// nome, e NENHUMA região viva.
//
// O mecanismo desta stack, medido em node_modules: o foco é preso pelo
// FloatingFocusManager do DialogPopup, com modal !== false, que também devolve
// o foco ao gatilho (returnFocus); a dispensa sai do useDismiss da raiz
// (escapeKey só no diálogo do topo, outsidePress restrito ao backdrop do
// próprio diálogo); a trava de rolagem cai de useScrollLock(open && modal ===
// true), e portanto só do modal de verdade.
//
// O primitivo isola o resto do documento com `inert`/`aria-hidden` e NÃO emite
// `aria-modal` (conferido em node_modules). Quem cumpre o contrato de markup do
// design system é este wrapper, e para isso o Content precisa saber se a raiz é
// modal. `'trap-focus'` prende o foco mas deixa a página interativa: não é modal
// para o leitor de tela, e por isso não recebe o atributo.
const SheetModalContext = React.createContext<boolean | "trap-focus">(true)

function Sheet({ ...props }: SheetPrimitive.Root.Props) {
  return (
    <SheetModalContext.Provider value={props.modal ?? true}>
      <SheetPrimitive.Root data-slot="sheet" {...props} />
    </SheetModalContext.Provider>
  )
}

function SheetTrigger({ ...props }: SheetPrimitive.Trigger.Props) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetClose({ ...props }: SheetPrimitive.Close.Props) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />
}

function SheetPortal({ ...props }: SheetPrimitive.Portal.Props) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />
}

function SheetOverlay({ className, ...props }: SheetPrimitive.Backdrop.Props) {
  return (
    <SheetPrimitive.Backdrop
      data-slot="sheet-overlay"
      className={cn(
        "nds-sheet-overlay",
        className
      )}
      {...props}
    />
  )
}

function SheetContent({
  className,
  children,
  side = "right",
  showCloseButton = true,
  closeLabel = "Fechar",
  ...props
}: SheetPrimitive.Popup.Props & {
  side?: "top" | "right" | "bottom" | "left"
  showCloseButton?: boolean
  /**
   * Nome acessível do botão X. Era a palavra "Fechar" escrita direto no JSX, e
   * essa era a única string de interface do Sheet presa a um idioma: numa
   * página em inglês ou espanhol o leitor de tela ouvia português, sem que
   * nada na chamada pudesse mudar isso.
   */
  closeLabel?: string
}) {
  const modal = React.useContext(SheetModalContext)
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Popup
        data-slot="sheet-content"
        data-side={side}
        className={cn(
          "nds-sheet-content",
          className
        )}
        aria-modal={modal === true ? "true" : undefined}
        {...props}
      >
        {children}
        {showCloseButton && (
          <SheetPrimitive.Close
            data-slot="sheet-close"
            render={
              <Button
                variant="ghost"
                className="nds-sheet-close-position"
                size="icon-sm"
              />
            }
          >
            <XIcon
            />
            <span className="nds-sr-only">{closeLabel}</span>
          </SheetPrimitive.Close>
        )}
      </SheetPrimitive.Popup>
    </SheetPortal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("nds-sheet-header", className)}
      {...props}
    />
  )
}

/**
 * Corpo rolável do painel.
 *
 * `tabIndex={0}`, como no Vanilla: quando o conteúdo passa da altura do painel,
 * a região rolável precisa ser alcançável por teclado (WCAG 2.1.1 — é a regra
 * `scrollable-region-focusable` do axe). O `flex` do CSS compartilhado é o que
 * mantém o rodapé no lugar enquanto o corpo rola.
 */
function SheetBody({
  className,
  "aria-label": ariaLabel,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-body"
      tabIndex={0}
      role={ariaLabel ? "group" : undefined}
      aria-label={ariaLabel}
      className={cn("nds-sheet-body", className)}
      {...props}
    />
  )
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("nds-sheet-footer", className)}
      {...props}
    />
  )
}

function SheetTitle({ className, ...props }: SheetPrimitive.Title.Props) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn(
        "nds-sheet-title",
        className
      )}
      {...props}
    />
  )
}

function SheetDescription({
  className,
  ...props
}: SheetPrimitive.Description.Props) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("nds-sheet-description", className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetBody,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
