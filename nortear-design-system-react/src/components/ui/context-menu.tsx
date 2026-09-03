import type * as React from "react"
import { ContextMenu as ContextMenuPrimitive } from "@base-ui/react/context-menu"

import { cn } from "@/lib/utils"
import { ChevronRightIcon, CheckIcon } from "lucide-react"

function ContextMenu({ ...props }: ContextMenuPrimitive.Root.Props) {
  return <ContextMenuPrimitive.Root data-slot="context-menu" {...props} />
}

/**
 * A área que responde ao gesto.
 *
 * ─── Acessibilidade — versão curta ────────────────────────────────────────────
 *
 * Bloco canônico das cinco stacks: cabeçalho de `context-menu.ts` no Vanilla.
 * Do popup para dentro vale o contrato do DropdownMenu inteiro, porque aqui as
 * peças SÃO as de `@base-ui/react/menu`. O que diverge é a abertura:
 *
 *   1. O gatilho NÃO se anuncia. `context-menu/trigger/ContextMenuTrigger`
 *      renderiza uma `<div>` com os ouvintes do gesto e o mapeamento
 *      `pressableTriggerOpenStateMapping`, que só escreve `data-*` — nada de
 *      `aria-haspopup` nem `aria-expanded`, ao contrário do gatilho do
 *      DropdownMenu, que é um botão e carrega os dois. É escolha das quatro
 *      libs e está certa: `aria-haspopup` não vale em `generic`, o papel
 *      implícito desta `<div>`. O preço está pago por escrito no conteúdo
 *      compartilhado (`accessibility.warning`, `notes.tip5`).
 *   2. `tabIndex={0}` é REQUISITO, não enfeite: a tecla Menu e Shift+F10
 *      disparam `contextmenu` no elemento FOCADO — sem parada de tabulação o
 *      menu não existe para quem não usa mouse, e é esse caminho que
 *      `accessibility.keyboard` documenta.
 *   3. É também para ele que a lib devolve o foco ao fechar. Numa `<div>` sem
 *      `tabindex` esse `focus()` é no-op e o foco cai no `<body>` — medido em
 *      sonda, contra o que `testes.functional.item2` promete.
 */
function ContextMenuTrigger({
  className,
  ...props
}: ContextMenuPrimitive.Trigger.Props) {
  return (
    <ContextMenuPrimitive.Trigger
      data-slot="context-menu-trigger"
      className={cn("nds-context-menu-trigger", className)}
      tabIndex={0}
      {...props}
    />
  )
}

function ContextMenuContent({
  className,
  align = "start",
  alignOffset = 4,
  side = "right",
  sideOffset = 0,
  ...props
}: ContextMenuPrimitive.Popup.Props &
  Pick<
    ContextMenuPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset"
  >) {
  return (
    <ContextMenuPrimitive.Portal>
      <ContextMenuPrimitive.Positioner
        className="nds-dropdown-menu-positioner"
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
      >
        <ContextMenuPrimitive.Popup
          data-slot="context-menu-content"
          className={cn("nds-dropdown-menu-content", className)}
          {...props}
        />
      </ContextMenuPrimitive.Positioner>
    </ContextMenuPrimitive.Portal>
  )
}

function ContextMenuGroup({ ...props }: ContextMenuPrimitive.Group.Props) {
  return (
    <ContextMenuPrimitive.Group data-slot="context-menu-group" {...props} />
  )
}

function ContextMenuLabel({
  className,
  inset,
  ...props
}: ContextMenuPrimitive.GroupLabel.Props & {
  inset?: boolean
}) {
  return (
    <ContextMenuPrimitive.GroupLabel
      data-slot="context-menu-label"
      data-inset={inset}
      className={cn(
        "nds-dropdown-menu-label",
        className
      )}
      {...props}
    />
  )
}

function ContextMenuItem({
  className,
  inset,
  variant = "default",
  ...props
}: ContextMenuPrimitive.Item.Props & {
  inset?: boolean
  variant?: "default" | "destructive"
}) {
  return (
    <ContextMenuPrimitive.Item
      data-slot="context-menu-item"
      data-inset={inset}
      data-variant={variant}
      className={cn(
        "nds-dropdown-menu-item",
        className
      )}
      {...props}
    />
  )
}

function ContextMenuSub({ ...props }: ContextMenuPrimitive.SubmenuRoot.Props) {
  return (
    <ContextMenuPrimitive.SubmenuRoot data-slot="context-menu-sub" {...props} />
  )
}

function ContextMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: ContextMenuPrimitive.SubmenuTrigger.Props & {
  inset?: boolean
}) {
  return (
    <ContextMenuPrimitive.SubmenuTrigger
      data-slot="context-menu-sub-trigger"
      data-inset={inset}
      className={cn(
        "nds-dropdown-menu-sub-trigger",
        className
      )}
      {...props}
    >
      {children}
      <ChevronRightIcon className="nds-dropdown-menu-sub-trigger-chevron" />
    </ContextMenuPrimitive.SubmenuTrigger>
  )
}

function ContextMenuSubContent({
  ...props
}: React.ComponentProps<typeof ContextMenuContent>) {
  return (
    <ContextMenuContent
      data-slot="context-menu-sub-content"
      side="right"
      {...props}
    />
  )
}

function ContextMenuCheckboxItem({
  className,
  children,
  checked,
  inset,
  ...props
}: ContextMenuPrimitive.CheckboxItem.Props & {
  inset?: boolean
}) {
  return (
    <ContextMenuPrimitive.CheckboxItem
      data-slot="context-menu-checkbox-item"
      data-inset={inset}
      className={cn("nds-dropdown-menu-checkbox-item", className)}
      checked={checked}
      {...props}
    >
      <span
        className="nds-dropdown-menu-item-indicator"
        data-slot="context-menu-checkbox-item-indicator"
      >
        <ContextMenuPrimitive.CheckboxItemIndicator>
          <CheckIcon
          />
        </ContextMenuPrimitive.CheckboxItemIndicator>
      </span>
      {children}
    </ContextMenuPrimitive.CheckboxItem>
  )
}

function ContextMenuRadioGroup({
  ...props
}: ContextMenuPrimitive.RadioGroup.Props) {
  return (
    <ContextMenuPrimitive.RadioGroup
      data-slot="context-menu-radio-group"
      {...props}
    />
  )
}

function ContextMenuRadioItem({
  className,
  children,
  inset,
  ...props
}: ContextMenuPrimitive.RadioItem.Props & {
  inset?: boolean
}) {
  return (
    <ContextMenuPrimitive.RadioItem
      data-slot="context-menu-radio-item"
      data-inset={inset}
      className={cn("nds-dropdown-menu-radio-item", className)}
      {...props}
    >
      <span
        className="nds-dropdown-menu-item-indicator"
        data-slot="context-menu-radio-item-indicator"
      >
        <ContextMenuPrimitive.RadioItemIndicator>
          <CheckIcon
          />
        </ContextMenuPrimitive.RadioItemIndicator>
      </span>
      {children}
    </ContextMenuPrimitive.RadioItem>
  )
}

function ContextMenuSeparator({
  className,
  ...props
}: ContextMenuPrimitive.Separator.Props) {
  return (
    <ContextMenuPrimitive.Separator
      data-slot="context-menu-separator"
      className={cn("nds-dropdown-menu-separator", className)}
      {...props}
    />
  )
}

function ContextMenuShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="context-menu-shortcut"
      className={cn(
        "nds-dropdown-menu-shortcut",
        className
      )}
      {...props}
    />
  )
}

// `ContextMenuPortal` saiu da lista abaixo: o `ContextMenuContent` já portaliza
// por dentro, então o wrapper exportado só existia para ser importado em dupla e
// portalizar duas vezes. Nenhuma outra stack o expõe, e a anatomia do conteúdo
// compartilhado não lista peça de portal. Era resíduo do scaffold.
//
// A nota mora FORA das chaves de propósito: comentário entre elas quebra quem lê
// a lista de exportações por texto — a guarda das transforms do painel Code
// varre este bloco, e com o comentário dentro `ContextMenuSub` sumia do conjunto
// de nomes exportados.
export {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuRadioItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuGroup,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuRadioGroup,
}
