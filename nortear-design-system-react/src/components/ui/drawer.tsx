import * as React from "react"
import { Drawer as DrawerPrimitive } from "vaul"

import { cn } from "@/lib/utils"

// ─── Decisão de acessibilidade (bloco canônico no drawer da stack vanilla) ───
//
// Foco preso enquanto o painel existe, `role="dialog"` com nome vindo do título,
// `aria-modal` só no modo modal, Escape e clique no véu fechando, foco de volta
// ao gatilho, rolagem da página travada enquanto modal, corpo rolável com
// `tabindex="0"` e `role="group"` só quando nomeado, e NENHUMA região viva.
//
// O mecanismo desta stack: o diálogo por baixo do primitivo prende o foco por
// escopo de foco e trava a rolagem por remoção de scroll — conferido em
// node_modules —, mas NÃO emite `aria-modal`, que por isso é escrito aqui.
//
// Diverge do Sheet em quatro pontos deliberados: aqui existe gesto de arrastar
// (extra de ponteiro, nunca o único caminho — WCAG 2.5.7), existe alça
// decorativa, NÃO existe botão de fechar próprio (a saída visível é a do
// rodapé), e a largura sai de `--drawer-width`/`--drawer-max-width` em vez dos
// tokens do Sheet.
//
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
        {/* Alça: pura afordância. O CSS só a mostra na direção de baixo, e ela
            não recebe foco nem nome — anunciá-la só somaria ruído. */}
        <div className="nds-drawer-handle" aria-hidden="true" />
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
 * `.nds-drawer-body` traz `flex: 1 1 auto`, `min-height: 0` e `overflow: auto`.
 * A base `auto` é o que faz o corpo contribuir com a altura do conteúdo para o
 * painel — com a base zero do atalho `flex: 1` o teto de altura nunca aperta
 * ninguém, e o conteúdo transborda em vez de rolar. O `min-height: 0` é o que
 * o deixa ceder altura dentro do flex em coluna, em vez de esticar o painel e
 * empurrar o rodapé (com as ações) para fora da tela.
 */
function DrawerBody({
  className,
  "aria-label": ariaLabel,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-body"
      tabIndex={0}
      role={ariaLabel ? "group" : undefined}
      aria-label={ariaLabel}
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
