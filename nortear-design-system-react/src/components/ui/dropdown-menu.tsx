/**
 * CONTRATO DE ACESSIBILIDADE DO MENU — versão curta; o bloco canônico, com a
 * medição das cinco stacks, está no cabeçalho do `dropdown-menu` do Vanilla.
 *
 * Cumprido igual em todas: `aria-haspopup="menu"` + `aria-expanded` no gatilho;
 * `role="menu"` no painel e `menuitem` / `menuitemcheckbox` / `menuitemradio`
 * nos itens; setas, `Home`/`End` e typeahead; `Escape` fecha e devolve o foco ao
 * gatilho; nenhuma região viva.
 *
 * O item DESABILITADO: a seta POUSA nele. Decisão do design system tomada em
 * 2026-09-02 e válida nas cinco stacks — a WAI-ARIA APG pede que o item
 * desabilitado siga alcançável pela seta para ser ANUNCIADO, porque tirá-lo da
 * roda esconde de quem navega de ouvido que a opção existe e está indisponível.
 * O que ele não faz é ATIVAR.
 *
 * MECANISMO DESTA STACK: nada a alterar, ela já cumpria a decisão.
 * `menu/item/useMenuItem` monta o item com
 * `useButton({ focusableWhenDisabled: true })`, e `menu/root/MenuRoot` chama
 * `useListNavigation` com `disabledIndices: EMPTY_ARRAY` — nenhum índice conta
 * como desabilitado para a navegação. A story `ItemDisabled` aperta a seta e
 * verifica onde o foco pousa. Medido na fonte em 2026-09-02.
 */
import * as React from "react"
import { Menu as MenuPrimitive } from "@base-ui/react/menu"

import { cn } from "@/lib/utils"
import { ChevronRightIcon, CheckIcon } from "lucide-react"
import { withReason } from "./context-menu-close-reason"
import { assignRef, tabbableBeside } from "./menu-tab-exit"

/**
 * Tab FECHA o menu e o foco SEGUE O PERCURSO DA PÁGINA a partir do GATILHO
 * (contrato C2, PRD dropdown-menu D1) — e a lib acerta só metade.
 *
 * `@base-ui/react` 1.7.0 não trata o Tab no painel do DropdownMenu: o
 * `FloatingFocusManager` é não modal (`modal: isContextMenu`, em
 * `menu/popup/MenuPopup.js`) e deixa a tecla para o navegador, contando com as
 * âncoras de foco em volta do portal. Medido em 2026-09-10 com teclado REAL
 * (CDP), foco num item, um botão antes e outro depois do gatilho:
 *
 *   Tab                        fecha, foco no vizinho DEPOIS          certo
 *   Tab no submenu             fecha tudo, foco no vizinho DEPOIS     certo
 *   Shift+Tab                  fecha, foco no GATILHO                 errado
 *   Shift+Tab no submenu       fecha SÓ o submenu, foco no sub-gatilho errado
 *   Tab, gatilho como última   fecha, foco no vizinho ANTES — a lib   errado
 *   parada da página           dá a volta ao início da página
 *
 * E no Menubar, que compõe estas peças (`MenubarMenu` é um `DropdownMenu`):
 * Shift+Tab deixava o menu ABERTO com o foco no gatilho, e no submenu fechava
 * só o submenu. O Shift+Tab da âncora de foco anterior ao painel vai para
 * `previousFocusableElement`, que a lib amarra ao próprio gatilho.
 *
 * O conserto mora no wrapper, com a mesma forma do ContextMenu:
 *
 *   1. `DropdownMenuTrigger` registra o nó do gatilho na raiz — é a âncora.
 *   2. `DropdownMenuContent` ouve Tab e Shift+Tab no painel — do submenu
 *      também, porque o evento sobe pela árvore do React até o painel raiz.
 *      Segura o salto nativo (`preventDefault`) e cala o tratamento da lib
 *      (`preventBaseUIHandler`), que no Shift+Tab fecharia só o painel em que
 *      está e focaria o gatilho dele.
 *   3. A raiz calcula o destino a partir do GATILHO (`tabbableBeside`: o
 *      próximo ponto de tabulação depois dele, ou o anterior no Shift+Tab —
 *      os outros gatilhos de uma barra de menus têm `tabindex="-1"` e saem da
 *      conta, então o destino fica fora da barra), fecha o menu inteiro por
 *      `actionsRef.close()` e põe o foco lá. Com o foco já fora do painel, o
 *      retorno de foco da lib não o puxa de volta. Sem destino, a lib devolve o
 *      foco ao gatilho, como no Escape.
 *   4. A raiz troca o motivo `imperative-action` por `focus-out` — o mesmo que
 *      a lib já entregava no Tab que acertava, e o que diz "saiu sem decidir".
 *
 * O `modal` da raiz (véu de interação, D1) não é tocado.
 */
type TabExitContextValue = {
  registerTrigger: (node: HTMLElement | null) => void
  closeByTab: (direction: "next" | "prev") => void
}

const TabExitContext = React.createContext<TabExitContextValue | null>(null)

function DropdownMenu({
  actionsRef: actionsRefProp,
  onOpenChange,
  ...props
}: MenuPrimitive.Root.Props) {
  const internalActionsRef = React.useRef<MenuPrimitive.Root.Actions | null>(null)
  const actionsRef = actionsRefProp ?? internalActionsRef
  const triggerRef = React.useRef<HTMLElement | null>(null)
  const closingByTabRef = React.useRef(false)

  const tabExit = React.useMemo<TabExitContextValue>(
    () => ({
      registerTrigger(node) {
        triggerRef.current = node
      },
      closeByTab(direction) {
        const trigger = triggerRef.current
        const target = trigger ? tabbableBeside(trigger, direction) : null
        closingByTabRef.current = true
        actionsRef.current?.close()
        target?.focus()
      },
    }),
    [actionsRef],
  )

  const handleOpenChange = React.useCallback(
    (open: boolean, eventDetails: MenuPrimitive.Root.ChangeEventDetails) => {
      const byTab = closingByTabRef.current
      closingByTabRef.current = false
      onOpenChange?.(open, !open && byTab ? withReason(eventDetails, "focus-out") : eventDetails)
    },
    [onOpenChange],
  )

  return (
    <TabExitContext.Provider value={tabExit}>
      <MenuPrimitive.Root
        data-slot="dropdown-menu"
        actionsRef={actionsRef}
        onOpenChange={handleOpenChange}
        {...props}
      />
    </TabExitContext.Provider>
  )
}

type DropdownMenuTriggerProps = MenuPrimitive.Trigger.Props & {
  asChild?: boolean
  children?: React.ReactNode
}
function DropdownMenuTrigger({ asChild, children, ref, ...props }: DropdownMenuTriggerProps) {
  const registerTrigger = React.useContext(TabExitContext)?.registerTrigger
  // A raiz precisa do nó do gatilho para achar o vizinho quando o Tab fecha o
  // menu; o `ref` de quem consome continua recebendo o nó.
  const setRefs = React.useCallback(
    (node: HTMLButtonElement | null) => {
      registerTrigger?.(node)
      assignRef(ref, node)
    },
    [registerTrigger, ref],
  )

  // Sem `nativeButton={false}`: todos os call sites passam <Button>, que é um
  // <button> nativo. Declarar o contrário faz o Base UI logar console.error em
  // dev e aplicar role="button" + handlers de teclado redundantes. A prop só
  // cabe quando o render é outro elemento — ver pagination.tsx, que renderiza <a>.
  if (asChild && React.isValidElement(children)) {
    return (
      <MenuPrimitive.Trigger
        data-slot="dropdown-menu-trigger"
        render={children as React.ReactElement}
        ref={setRefs}
        {...(props as MenuPrimitive.Trigger.Props)}
      />
    )
  }
  return (
    <MenuPrimitive.Trigger
      data-slot="dropdown-menu-trigger"
      ref={setRefs}
      {...(props as MenuPrimitive.Trigger.Props)}
    >
      {children}
    </MenuPrimitive.Trigger>
  )
}

function DropdownMenuContent({
  align = "start",
  alignOffset = 0,
  side = "bottom",
  sideOffset = 4,
  className,
  onKeyDown,
  ...props
}: MenuPrimitive.Popup.Props &
  Pick<
    MenuPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset"
  >) {
  const tabExit = React.useContext(TabExitContext)

  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Positioner
        className="nds-dropdown-menu-positioner"
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
      >
        <MenuPrimitive.Popup
          data-slot="dropdown-menu-content"
          className={cn("nds-dropdown-menu-content", className)}
          {...props}
          // PATCH: a11y — a base-ui deixa o Shift+Tab no gatilho e o Tab da última parada no início da página (ver PATCHES.md#react-dropdown-menu-tab-exit)
          // Aqui o Tab fecha o menu inteiro e o foco segue a página a partir
          // do gatilho, como manda o C2 — ver o bloco sobre `TabExitContext`.
          onKeyDown={(event) => {
            onKeyDown?.(event)
            // Tab e Shift+Tab. Ctrl/Alt/Meta+Tab são do navegador e do sistema.
            // `defaultPrevented` no evento NATIVO é o que impede o painel raiz
            // de agir de novo quando a tecla veio de um submenu — o evento sobe
            // pelos dois.
            if (
              !tabExit ||
              event.key !== "Tab" ||
              event.ctrlKey ||
              event.altKey ||
              event.metaKey ||
              event.nativeEvent.defaultPrevented
            ) {
              return
            }
            event.preventDefault()
            // Sem isto, o Shift+Tab ainda passaria pelo tratamento da lib, que
            // fecha só o painel em que está e foca o gatilho dele.
            event.preventBaseUIHandler()
            tabExit.closeByTab(event.shiftKey ? "prev" : "next")
          }}
        />
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  )
}

function DropdownMenuGroup({ ...props }: MenuPrimitive.Group.Props) {
  return <MenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />
}

function DropdownMenuLabel({
  className,
  inset,
  ...props
}: MenuPrimitive.GroupLabel.Props & {
  inset?: boolean
}) {
  return (
    <MenuPrimitive.GroupLabel
      data-slot="dropdown-menu-label"
      data-inset={inset}
      className={cn(
        "nds-dropdown-menu-label",
        className
      )}
      {...props}
    />
  )
}

function DropdownMenuItem({
  className,
  inset,
  variant = "default",
  ...props
}: MenuPrimitive.Item.Props & {
  inset?: boolean
  variant?: "default" | "destructive"
}) {
  return (
    <MenuPrimitive.Item
      data-slot="dropdown-menu-item"
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

function DropdownMenuSub({ ...props }: MenuPrimitive.SubmenuRoot.Props) {
  return <MenuPrimitive.SubmenuRoot data-slot="dropdown-menu-sub" {...props} />
}

function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: MenuPrimitive.SubmenuTrigger.Props & {
  inset?: boolean
  asChild?: boolean
}) {
  return (
    <MenuPrimitive.SubmenuTrigger
      data-slot="dropdown-menu-sub-trigger"
      data-inset={inset}
      className={cn(
        "nds-dropdown-menu-sub-trigger",
        className
      )}
      {...(props as MenuPrimitive.SubmenuTrigger.Props)}
    >
      {children}
      <ChevronRightIcon className="nds-dropdown-menu-sub-trigger-chevron" />
    </MenuPrimitive.SubmenuTrigger>
  )
}

function DropdownMenuSubContent({
  align = "start",
  alignOffset = -3,
  side = "right",
  sideOffset = 0,
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuContent>) {
  return (
    <DropdownMenuContent
      data-slot="dropdown-menu-sub-content"
      className={cn(className)}
      align={align}
      alignOffset={alignOffset}
      side={side}
      sideOffset={sideOffset}
      {...props}
    />
  )
}

function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  inset,
  ...props
}: MenuPrimitive.CheckboxItem.Props & {
  inset?: boolean
}) {
  return (
    <MenuPrimitive.CheckboxItem
      data-slot="dropdown-menu-checkbox-item"
      data-inset={inset}
      className={cn(
        "nds-dropdown-menu-checkbox-item",
        className
      )}
      checked={checked}
      {...props}
    >
      <span
        className="nds-dropdown-menu-item-indicator"
        data-slot="dropdown-menu-checkbox-item-indicator"
      >
        <MenuPrimitive.CheckboxItemIndicator>
          <CheckIcon
          />
        </MenuPrimitive.CheckboxItemIndicator>
      </span>
      {children}
    </MenuPrimitive.CheckboxItem>
  )
}

function DropdownMenuRadioGroup({ ...props }: MenuPrimitive.RadioGroup.Props) {
  return (
    <MenuPrimitive.RadioGroup
      data-slot="dropdown-menu-radio-group"
      {...props}
    />
  )
}

function DropdownMenuRadioItem({
  className,
  children,
  inset,
  ...props
}: MenuPrimitive.RadioItem.Props & {
  inset?: boolean
}) {
  return (
    <MenuPrimitive.RadioItem
      data-slot="dropdown-menu-radio-item"
      data-inset={inset}
      className={cn("nds-dropdown-menu-radio-item", className)}
      {...props}
    >
      <span
        className="nds-dropdown-menu-item-indicator"
        data-slot="dropdown-menu-radio-item-indicator"
      >
        <MenuPrimitive.RadioItemIndicator>
          <CheckIcon
          />
        </MenuPrimitive.RadioItemIndicator>
      </span>
      {children}
    </MenuPrimitive.RadioItem>
  )
}

function DropdownMenuSeparator({
  className,
  ...props
}: MenuPrimitive.Separator.Props) {
  return (
    <MenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      className={cn("nds-dropdown-menu-separator", className)}
      {...props}
    />
  )
}

function DropdownMenuShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="dropdown-menu-shortcut"
      className={cn(
        "nds-dropdown-menu-shortcut",
        className
      )}
      {...props}
    />
  )
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
}
