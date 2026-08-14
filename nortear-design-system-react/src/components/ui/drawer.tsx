import * as React from "react"
import { Drawer as DrawerPrimitive } from "vaul"

import { cn } from "@/lib/utils"

// O primitivo desta stack (e o diálogo que ele usa por baixo) NÃO emite
// `aria-modal` — conferido em node_modules. Quem cumpre o contrato de markup do
// design system é este wrapper, e para isso o Content precisa saber se a raiz é
// modal.
const DrawerModalContext = React.createContext(true)

/**
 * `autoFocus` nasce `false` no primitivo, e o efeito é silencioso: ao abrir, o
 * painel chama `preventDefault()` no `onOpenAutoFocus` e o foco FICA no gatilho,
 * fora do diálogo. O foco continua preso (Tab não escapa), mas quem navega por
 * teclado precisa de um Tab só para entrar, e o leitor de tela não anuncia o
 * painel que acabou de abrir.
 *
 * O conteúdo compartilhado documenta o contrário (`functional.item3`,
 * `accessibility.item4`) e é o que a WCAG 2.4.3 espera de um modal, então o
 * default do design system é `true`. Quem precisar do comportamento do
 * primitivo ainda pode passar `autoFocus={false}`.
 */
function Drawer({
  autoFocus = true,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root>) {
  return (
    <DrawerModalContext.Provider value={props.modal ?? true}>
      <DrawerPrimitive.Root data-slot="drawer" autoFocus={autoFocus} {...props} />
    </DrawerModalContext.Provider>
  )
}

function DrawerTrigger({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Trigger>) {
  return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />
}

function DrawerPortal({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Portal>) {
  return <DrawerPrimitive.Portal data-slot="drawer-portal" {...props} />
}

function DrawerClose({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Close>) {
  return <DrawerPrimitive.Close data-slot="drawer-close" {...props} />
}

function DrawerOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Overlay>) {
  return (
    <DrawerPrimitive.Overlay
      data-slot="drawer-overlay"
      className={cn(
        "nds-sheet-overlay",
        className
      )}
      {...props}
    />
  )
}

function DrawerContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Content>) {
  const modal = React.useContext(DrawerModalContext)
  return (
    <DrawerPortal data-slot="drawer-portal">
      <DrawerOverlay />
      <DrawerPrimitive.Content
        data-slot="drawer-content"
        className={cn(
          "nds-drawer-content",
          className
        )}
        aria-modal={modal ? "true" : undefined}
        {...props}
      >
        <div className="nds-drawer-handle" />
        {children}
      </DrawerPrimitive.Content>
    </DrawerPortal>
  )
}

function DrawerHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-header"
      className={cn(
        "nds-drawer-header",
        className
      )}
      {...props}
    />
  )
}

/**
 * Corpo rolável do painel.
 *
 * `tabIndex={0}` é obrigatório, não decoração: uma região que rola precisa ser
 * alcançável por teclado (WCAG 2.1.1 — é a regra `scrollable-region-focusable`
 * do axe, que reprovava a composição de conteúdo longo desta stack). O `role`
 * e o nome acessível ficam a cargo de quem compõe, porque só ali se sabe o que
 * a região contém.
 *
 * `.nds-drawer-body` traz `flex: 1`, `min-height: 0` e `overflow: auto` — é o
 * `min-height: 0` que faz o corpo ceder altura dentro do flex em coluna em vez
 * de esticar o painel e empurrar o rodapé (com as ações) para fora da tela.
 */
function DrawerBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-body"
      tabIndex={0}
      className={cn("nds-drawer-body", className)}
      {...props}
    />
  )
}

function DrawerFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-footer"
      className={cn("nds-drawer-footer", className)}
      {...props}
    />
  )
}

function DrawerTitle({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Title>) {
  return (
    <DrawerPrimitive.Title
      data-slot="drawer-title"
      className={cn(
        "nds-sheet-title",
        className
      )}
      {...props}
    />
  )
}

function DrawerDescription({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Description>) {
  return (
    <DrawerPrimitive.Description
      data-slot="drawer-description"
      className={cn("nds-sheet-description", className)}
      {...props}
    />
  )
}

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
}
