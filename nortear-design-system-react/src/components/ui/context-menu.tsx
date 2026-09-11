import * as React from "react"
import { ContextMenu as ContextMenuPrimitive } from "@base-ui/react/context-menu"

import { cn } from "@/lib/utils"
import { ChevronRightIcon, CheckIcon, MinusIcon } from "lucide-react"
import { withReason } from "./menu-close-reason"
import { assignRef, tabbableBeside } from "./menu-tab-exit"

/**
 * Tab FECHA o menu e SEGUE O PERCURSO DA PÁGINA (contrato C2, PRD dropdown-menu
 * D1) — e a lib, sozinha, o prende.
 *
 * Medido na fonte, `@base-ui/react` 1.7.0: `menu/popup/MenuPopup.js` passa
 * `modal: isContextMenu` ao `FloatingFocusManager`, e com `modal` ligado o Tab
 * não sai do painel — o item destacado é a única parada de tabulação lá dentro
 * e as âncoras de foco do portal devolvem o foco a ele. O `modal` da RAIZ, que é
 * outra coisa (véu de interação e trava de rolagem, D1), não é tocado: a
 * `ContextMenu.Root` nem expõe a prop.
 *
 * O conserto mora no wrapper e tem quatro peças:
 *
 *   1. `ContextMenuTrigger` registra o nó da área na raiz: é a âncora do
 *      percurso.
 *   2. `ContextMenuContent` ouve Tab e Shift+Tab no painel — do submenu também,
 *      porque o evento sobe pela árvore do React até o painel raiz. Segura o
 *      salto nativo (`preventDefault`), que cairia nas âncoras de foco do portal
 *      e voltaria para dentro do painel, e cala o tratamento da lib
 *      (`preventBaseUIHandler`), que no Shift+Tab fecharia só o submenu.
 *   3. A raiz calcula o destino a partir da ÁREA (`tabbableBeside`: o próximo
 *      ponto de tabulação depois dela, ou o anterior no Shift+Tab), fecha o
 *      menu inteiro por `actionsRef.close()` e põe o foco lá. Com o foco já fora
 *      do painel, o retorno de foco da lib não o puxa de volta. Sem destino (a
 *      área é a última parada da página), a lib devolve o foco à área, como no
 *      Escape.
 *   4. A raiz troca o motivo do fechamento de `imperative-action` para
 *      `focus-out`: é o que a lib entrega quando o foco sai de um menu que não
 *      prende, e é o que diz "saiu sem decidir" a quem mede — ver `withReason`.
 */
type TabExitContextValue = {
  registerArea: (node: HTMLElement | null) => void
  closeByTab: (direction: "next" | "prev") => void
}

const TabExitContext = React.createContext<TabExitContextValue | null>(null)

function ContextMenu({
  actionsRef: actionsRefProp,
  onOpenChange,
  ...props
}: ContextMenuPrimitive.Root.Props) {
  const internalActionsRef = React.useRef<ContextMenuPrimitive.Root.Actions | null>(null)
  const actionsRef = actionsRefProp ?? internalActionsRef
  const areaRef = React.useRef<HTMLElement | null>(null)
  const closingByTabRef = React.useRef(false)

  const tabExit = React.useMemo<TabExitContextValue>(
    () => ({
      registerArea(node) {
        areaRef.current = node
      },
      closeByTab(direction) {
        const area = areaRef.current
        const target = area ? tabbableBeside(area, direction) : null
        closingByTabRef.current = true
        actionsRef.current?.close()
        target?.focus()
      },
    }),
    [actionsRef],
  )

  const handleOpenChange = React.useCallback(
    (open: boolean, eventDetails: ContextMenuPrimitive.Root.ChangeEventDetails) => {
      const byTab = closingByTabRef.current
      closingByTabRef.current = false
      onOpenChange?.(open, !open && byTab ? withReason(eventDetails, "focus-out") : eventDetails)
    },
    [onOpenChange],
  )

  return (
    <TabExitContext.Provider value={tabExit}>
      <ContextMenuPrimitive.Root
        data-slot="context-menu"
        actionsRef={actionsRef}
        onOpenChange={handleOpenChange}
        {...props}
      />
    </TabExitContext.Provider>
  )
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
  ref,
  ...props
}: ContextMenuPrimitive.Trigger.Props) {
  const registerArea = React.useContext(TabExitContext)?.registerArea
  // A raiz precisa do nó da área para achar o próximo ponto de tabulação
  // quando o Tab fecha o menu; o `ref` de quem consome continua recebendo o nó.
  const setRefs = React.useCallback(
    (node: HTMLDivElement | null) => {
      registerArea?.(node)
      assignRef(ref, node)
    },
    [registerArea, ref],
  )

  return (
    <ContextMenuPrimitive.Trigger
      data-slot="context-menu-trigger"
      className={cn("nds-context-menu-trigger", className)}
      tabIndex={0}
      ref={setRefs}
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
  onKeyDown,
  ...props
}: ContextMenuPrimitive.Popup.Props &
  Pick<
    ContextMenuPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset"
  >) {
  const tabExit = React.useContext(TabExitContext)

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
          // PATCH: a11y — a base-ui prende o Tab no painel do menu de contexto (ver PATCHES.md#react-context-menu-tab-exit)
          // (`modal: isContextMenu` no FloatingFocusManager); aqui ele fecha o
          // menu e o foco segue a página, como manda o C2.
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
      data-inset={inset || undefined}
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
      // `|| undefined`: com `inset={false}` o React escreveria
      // `data-inset="false"`, e a folha seleciona por PRESENÇA (`[data-inset]`)
      // — o item sairia recuado justamente quando pediram que não.
      data-inset={inset || undefined}
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
      data-inset={inset || undefined}
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

/**
 * Item de marcação, com o estado MISTO que a lib não tem.
 *
 * O `Menu.CheckboxItem` da base-ui é de dois estados: `checked` é booleano e o
 * `aria-checked` que ele escreve também. O misto ("alguns dos filhos marcados",
 * D8) mora aqui, no wrapper, por decisão da dona (2026-09-10), e se apoia numa
 * leitura da fonte (`menu/checkbox-item/MenuCheckboxItem.js`, 1.7.0): a lista de
 * props é `[itemProps, { role, 'aria-checked': checked, onClick }, elementProps,
 * getItemProps]`, e as props de FORA vêm depois do `aria-checked` interno — o
 * `"mixed"` passado aqui é o que chega ao DOM. Nenhuma outra peça da lib escreve
 * `aria-checked` no item.
 *
 * Três decisões, na ordem em que valem:
 *
 *   1. O `aria-checked="mixed"` só entra no objeto de props QUANDO é misto. Uma
 *      chave com `undefined` sobrescreveria o valor da lib e apagaria o atributo
 *      dos dois outros estados.
 *   2. Enquanto misto, a lib recebe `checked={false}`: o primeiro clique chama
 *      `onCheckedChange(true)` e resolve o misto para MARCADO, como a
 *      propriedade `indeterminate` do input nativo. Quem guarda o estado tira o
 *      `indeterminate` nesse callback — a prop é controlada, como a do
 *      `Checkbox` avulso desta stack.
 *   3. O traço é desenhado aqui, e não dentro do indicador da lib, que só monta
 *      com o item marcado. Tique quer dizer "marcado", e misto não é isso.
 */
function ContextMenuCheckboxItem({
  className,
  children,
  checked,
  indeterminate = false,
  ...props
}: ContextMenuPrimitive.CheckboxItem.Props & {
  /** Estado misto: anunciado como `mixed` e desenhado com traço. Controlado. */
  indeterminate?: boolean
}) {
  return (
    <ContextMenuPrimitive.CheckboxItem
      data-slot="context-menu-checkbox-item"
      className={cn("nds-dropdown-menu-checkbox-item", className)}
      {...props}
      checked={indeterminate ? false : checked}
      // PATCH: a11y — o item de marcação da base-ui é de dois estados (ver PATCHES.md#react-context-menu-mixed-checkbox)
      // O misto (D8) entra pelo wrapper.
      {...(indeterminate ? { "aria-checked": "mixed" as const } : {})}
    >
      <span
        className="nds-dropdown-menu-item-indicator"
        data-slot="context-menu-checkbox-item-indicator"
      >
        {indeterminate ? (
          <MinusIcon aria-hidden="true" />
        ) : (
          <ContextMenuPrimitive.CheckboxItemIndicator>
            <CheckIcon />
          </ContextMenuPrimitive.CheckboxItemIndicator>
        )}
      </span>
      {children}
    </ContextMenuPrimitive.CheckboxItem>
  )
}

/**
 * Grupo de escolha única — e é ELE o grupo que o rótulo nomeia.
 *
 * O `ContextMenuLabel` vai DENTRO dele: `RadioGroup > Label + RadioItem…`, a
 * forma de svelte, angular e vanilla. Não precisa de nada no wrapper — medido
 * na fonte da `@base-ui/react` 1.7.0: `menu/radio-group/MenuRadioGroup.js`
 * renderiza `role="group"` com `aria-labelledby` e fornece o mesmo
 * `MenuGroupContext` que o `Menu.Group`, e o `Menu.GroupLabel` registra o seu
 * `id` nesse contexto.
 *
 * O arranjo antigo, `Group > Label + RadioGroup`, montava DOIS grupos
 * aninhados: o de fora com nome, o de dentro — o que de fato contém as opções —
 * anônimo.
 */
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

// Sem `inset`, como o item de marcação: a folha só recua item, rótulo e
// sub-gatilho (`[data-inset]` em `dropdown-menu.css`), e a prop aceita aqui não
// movia nada — documentada, ela prometia um recuo que não acontecia.
function ContextMenuRadioItem({
  className,
  children,
  ...props
}: ContextMenuPrimitive.RadioItem.Props) {
  return (
    <ContextMenuPrimitive.RadioItem
      data-slot="context-menu-radio-item"
      className={cn("nds-dropdown-menu-radio-item", className)}
      {...props}
    >
      <span
        className="nds-dropdown-menu-item-indicator"
        data-slot="context-menu-radio-item-indicator"
      >
        <ContextMenuPrimitive.RadioItemIndicator>
          <CheckIcon />
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
