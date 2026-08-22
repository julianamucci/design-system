"use client"

import * as React from "react"
import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { SIDEBAR_MOBILE_QUERY, useIsMobile } from "@/hooks/use-mobile"
import { ROTULOS_SIDEBAR_PADRAO } from "@shared/primitives/sidebar-a11y-labels"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { PanelLeftIcon } from "lucide-react"

const SIDEBAR_COOKIE_NAME = "sidebar_state"
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7
const SIDEBAR_WIDTH = "16rem"
const SIDEBAR_WIDTH_MOBILE = "18rem"
const SIDEBAR_WIDTH_ICON = "3rem"
const SIDEBAR_KEYBOARD_SHORTCUT = "b"

type SidebarContextProps = {
  state: "expanded" | "collapsed"
  open: boolean
  setOpen: (open: boolean) => void
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
  isMobile: boolean
  toggleSidebar: () => void
}

const SidebarContext = React.createContext<SidebarContextProps | null>(null)

function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.")
  }

  return context
}

function SidebarProvider({
  defaultOpen = true,
  open: openProp,
  onOpenChange: setOpenProp,
  mobileQuery = SIDEBAR_MOBILE_QUERY,
  className,
  style,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /**
   * A consulta de mídia que decide se a barra vira gaveta sobreposta.
   *
   * Existe como prop, e não só como constante, porque o ponto de virada é do
   * produto e não do design system — uma aplicação com sidebar mais estreita
   * vira mais tarde. É também o que permite exercitar o caminho móvel sem
   * redimensionar o navegador: uma consulta sempre verdadeira força a gaveta de
   * forma determinística, inclusive no runner headless.
   *
   * Fica DESESTRUTURADA de propósito: se caísse no `...props` viraria atributo
   * desconhecido no `<div>` e o React reclamaria no console.
   */
  mobileQuery?: string
}) {
  const isMobile = useIsMobile(mobileQuery)
  const [openMobile, setOpenMobile] = React.useState(false)

  // This is the internal state of the sidebar.
  // We use openProp and setOpenProp for control from outside the component.
  const [_open, _setOpen] = React.useState(defaultOpen)
  const open = openProp ?? _open
  const setOpen = React.useCallback(
    (value: boolean | ((value: boolean) => boolean)) => {
      const openState = typeof value === "function" ? value(open) : value
      if (setOpenProp) {
        setOpenProp(openState)
      } else {
        _setOpen(openState)
      }

      // This sets the cookie to keep the sidebar state.
      document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`
    },
    [setOpenProp, open]
  )

  // Helper to toggle the sidebar.
  const toggleSidebar = React.useCallback(() => {
    return isMobile ? setOpenMobile((open) => !open) : setOpen((open) => !open)
  }, [isMobile, setOpen, setOpenMobile])

  // Adds a keyboard shortcut to toggle the sidebar.
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === SIDEBAR_KEYBOARD_SHORTCUT &&
        (event.metaKey || event.ctrlKey)
      ) {
        event.preventDefault()
        toggleSidebar()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [toggleSidebar])

  // We add a state so that we can do data-state="expanded" or "collapsed".
  // This makes it easier to style the sidebar with CSS (.nds-* / data-attrs).
  const state = open ? "expanded" : "collapsed"

  const contextValue = React.useMemo<SidebarContextProps>(
    () => ({
      state,
      open,
      setOpen,
      isMobile,
      openMobile,
      setOpenMobile,
      toggleSidebar,
    }),
    [state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar]
  )

  return (
    <SidebarContext.Provider value={contextValue}>
      <div
        data-slot="sidebar-wrapper"
        style={
          {
            "--sidebar-width": SIDEBAR_WIDTH,
            "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
            ...style,
          } as React.CSSProperties
        }
        className={cn(
          "nds-sidebar-wrapper",
          className
        )}
        {...props}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  )
}

function Sidebar({
  side = "left",
  variant = "sidebar",
  collapsible = "offcanvas",
  mobileTitle = ROTULOS_SIDEBAR_PADRAO.tituloMovel,
  mobileDescription = ROTULOS_SIDEBAR_PADRAO.descricaoMovel,
  className,
  children,
  dir,
  ...props
}: React.ComponentProps<"div"> & {
  side?: "left" | "right"
  variant?: "sidebar" | "floating" | "inset"
  collapsible?: "offcanvas" | "icon" | "none"
  /**
   * Nome e descrição da gaveta sobreposta, só para leitor de tela.
   *
   * O padrão vem do conteúdo compartilhado, em português. São props e não
   * literais porque o texto pertence ao produto: uma aplicação em outro idioma
   * — ou que chame a barra de outra coisa — precisa poder trocá-lo sem editar o
   * componente. Ficam DESESTRUTURADOS de propósito: no `...props` virariam
   * atributos desconhecidos no elemento.
   */
  mobileTitle?: string
  mobileDescription?: string
}) {
  const { isMobile, state, openMobile, setOpenMobile } = useSidebar()

  if (collapsible === "none") {
    return (
      <div
        data-slot="sidebar"
        className={cn(
          "nds-sidebar-static",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }

  if (isMobile) {
    // `className` e o resto das props vão para o PAINEL, não para a raiz do
    // Sheet: a raiz não renderiza elemento nenhum, então tudo o que caísse ali
    // sumiria em silêncio — a classe de quem compõe desaparecia só em tela
    // estreita. Na coluna elas pousam em `.nds-sidebar-panel`; aqui, na gaveta,
    // que é o mesmo papel. O `style` de fora entra depois da medida móvel para
    // poder sobrescrevê-la.
    const { style: estiloDeFora, ...restante } = props
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile}>
        <SheetContent
          dir={dir}
          data-sidebar="sidebar"
          data-slot="sidebar"
          data-mobile="true"
          className={cn("nds-sidebar-mobile", className)}
          style={
            {
              "--sidebar-width": SIDEBAR_WIDTH_MOBILE,
              ...estiloDeFora,
            } as React.CSSProperties
          }
          side={side}
          {...restante}
        >
          <SheetHeader className="nds-sr-only">
            <SheetTitle>{mobileTitle}</SheetTitle>
            <SheetDescription>{mobileDescription}</SheetDescription>
          </SheetHeader>
          <div className="nds-sidebar-mobile-inner">{children}</div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <div
      className="nds-sidebar-root"
      data-state={state}
      data-collapsible={state === "collapsed" ? collapsible : ""}
      data-variant={variant}
      data-side={side}
      data-slot="sidebar"
    >
      {/* This is what handles the sidebar gap on desktop */}
      <div data-slot="sidebar-gap" className="nds-sidebar-gap-inner" />
      <div
        data-slot="sidebar-container"
        data-side={side}
        className={cn("nds-sidebar-panel", className)}
        {...props}
      >
        <div
          data-sidebar="sidebar"
          data-slot="sidebar-inner"
          className="nds-sidebar-inner"
        >
          {children}
        </div>
      </div>
    </div>
  )
}

/**
 * Botão que alterna a barra.
 *
 * `label` é o nome acessível: o botão carrega só um ícone, e o ícone é
 * `aria-hidden`. O padrão vem do conteúdo compartilhado, em português — quem
 * ouve o controle principal do componente ouvia "Toggle Sidebar" até aqui.
 * Continua trocável para o caso em que o rótulo depende do contexto ("Abrir
 * navegação do produto").
 */
function SidebarTrigger({
  className,
  onClick,
  label = ROTULOS_SIDEBAR_PADRAO.alternar,
  ...props
}: React.ComponentProps<typeof Button> & { label?: string }) {
  const { toggleSidebar } = useSidebar()

  return (
    <Button
      data-sidebar="trigger"
      data-slot="sidebar-trigger"
      variant="ghost"
      size="icon-sm"
      className={cn(className)}
      onClick={(event) => {
        onClick?.(event)
        toggleSidebar()
      }}
      {...props}
    >
      <PanelLeftIcon />
      <span className="nds-sr-only">{label}</span>
    </Button>
  )
}

/**
 * Faixa clicável na borda do painel.
 *
 * `tabIndex={-1}` de propósito: ela faz o mesmo que o gatilho, que já está na
 * ordem de tabulação — duas paradas de teclado para uma ação só é ruído para
 * quem navega sem mouse. `aria-hidden` completa o par: sem ele, o leitor de
 * tela lista dois botões com o mesmo nome para a mesma ação, e um deles nem
 * recebe foco. O `title` fica: é a dica de ponteiro, para quem a faixa existe —
 * e vem do conteúdo compartilhado, em português, com o mesmo texto do gatilho,
 * porque a ação é a mesma. Vai ANTES do spread: um `title` de quem compõe ainda
 * ganha.
 */
function SidebarRail({ className, ...props }: React.ComponentProps<"button">) {
  const { toggleSidebar } = useSidebar()

  return (
    <button
      data-sidebar="rail"
      data-slot="sidebar-rail"
      aria-hidden="true"
      tabIndex={-1}
      onClick={toggleSidebar}
      title={ROTULOS_SIDEBAR_PADRAO.alternar}
      className={cn("nds-sidebar-rail", className)}
      {...props}
    />
  )
}

function SidebarInset({ className, ...props }: React.ComponentProps<"main">) {
  return (
    <main
      data-slot="sidebar-inset"
      className={cn("nds-sidebar-inset", className)}
      {...props}
    />
  )
}

function SidebarInput({
  className,
  ...props
}: React.ComponentProps<typeof Input>) {
  return (
    <Input
      data-slot="sidebar-input"
      data-sidebar="input"
      className={cn("nds-sidebar-input", className)}
      {...props}
    />
  )
}

function SidebarHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-header"
      data-sidebar="header"
      className={cn("nds-sidebar-header", className)}
      {...props}
    />
  )
}

function SidebarFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-footer"
      data-sidebar="footer"
      className={cn("nds-sidebar-footer", className)}
      {...props}
    />
  )
}

function SidebarSeparator({
  className,
  ...props
}: React.ComponentProps<typeof Separator>) {
  return (
    <Separator
      data-slot="sidebar-separator"
      data-sidebar="separator"
      className={cn("nds-sidebar-separator", className)}
      {...props}
    />
  )
}

function SidebarContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-content"
      data-sidebar="content"
      className={cn("nds-sidebar-content", className)}
      {...props}
    />
  )
}

function SidebarGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-group"
      data-sidebar="group"
      className={cn("nds-sidebar-group", className)}
      {...props}
    />
  )
}

function SidebarGroupLabel({
  className,
  render,
  ...props
}: useRender.ComponentProps<"div"> & React.ComponentProps<"div">) {
  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(
      {
        className: cn("nds-sidebar-group-label", className),
      },
      props
    ),
    render,
    state: {
      slot: "sidebar-group-label",
      sidebar: "group-label",
    },
  })
}

function SidebarGroupAction({
  className,
  render,
  ...props
}: useRender.ComponentProps<"button"> & React.ComponentProps<"button">) {
  return useRender({
    defaultTagName: "button",
    props: mergeProps<"button">(
      {
        className: cn("nds-sidebar-group-action", className),
      },
      props
    ),
    render,
    state: {
      slot: "sidebar-group-action",
      sidebar: "group-action",
    },
  })
}

function SidebarGroupContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-group-content"
      data-sidebar="group-content"
      className={cn("nds-sidebar-group-content", className)}
      {...props}
    />
  )
}

function SidebarMenu({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="sidebar-menu"
      data-sidebar="menu"
      className={cn("nds-sidebar-menu", className)}
      {...props}
    />
  )
}

function SidebarMenuItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="sidebar-menu-item"
      data-sidebar="menu-item"
      className={cn("nds-sidebar-menu-item", className)}
      {...props}
    />
  )
}

const sidebarMenuButtonVariants = cva("nds-sidebar-menu-button", {
  variants: {
    variant: {
      default: "",
      outline: "nds-sidebar-menu-button-outline",
    },
    size: {
      default: "",
      sm: "",
      lg: "",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
})

/**
 * Serialização de `active` como `data-active="true"`.
 *
 * A conversão automática de estado em atributo trata flag booleana como
 * atributo presente e vazio (`data-active=""`). A folha compartilhada do design
 * system casa `[data-active="true"]`, que é o que as demais implementações
 * emitem — com o atributo vazio, a regra de item ativo não pintava nada aqui.
 * O mapeamento devolve o valor textual e omite o atributo quando inativo, igual
 * às outras: presença do atributo é o próprio estado.
 */
const stateActiveAsText = {
  active: (ativo: boolean) => (ativo ? { "data-active": "true" } : null),
}

function SidebarMenuButton({
  render,
  isActive = false,
  variant = "default",
  size = "default",
  tooltip,
  className,
  ...props
}: useRender.ComponentProps<"button"> &
  React.ComponentProps<"button"> & {
    isActive?: boolean
    tooltip?: string | React.ComponentProps<typeof TooltipContent>
  } & VariantProps<typeof sidebarMenuButtonVariants>) {
  const { isMobile, state } = useSidebar()
  const comp = useRender({
    defaultTagName: "button",
    props: mergeProps<"button">(
      {
        className: cn(sidebarMenuButtonVariants({ variant, size }), className),
      },
      props
    ),
    render: !tooltip ? render : <TooltipTrigger render={render} />,
    state: {
      slot: "sidebar-menu-button",
      sidebar: "menu-button",
      size,
      active: isActive,
    },
    stateAttributesMapping: stateActiveAsText,
  })

  if (!tooltip) {
    return comp
  }

  if (typeof tooltip === "string") {
    tooltip = {
      children: tooltip,
    }
  }

  return (
    /**
     * O balão só faz sentido com a barra recolhida em ícones: é ali que o
     * rótulo do item some. Antes ele era montado sempre e apenas ESCONDIDO por
     * `hidden` — e um balão escondido continua sendo um flutuante ABERTO. Ele
     * abria ao foco e engolia o Escape (a lib fecha o flutuante mais interno e
     * interrompe a propagação): dentro da gaveta móvel, quem navega por teclado
     * precisava apertar Escape DUAS vezes para fechá-la, e a primeira não
     * fechava nada visível. `disabled` impede a abertura em vez de tapar o
     * resultado — e mantém a árvore estável, porque desmontar o `Tooltip` aqui
     * remontaria o próprio botão e derrubaria o foco a cada recolhimento.
     */
    <Tooltip disabled={state !== "collapsed" || isMobile}>
      {comp}
      <TooltipContent side="right" align="center" {...tooltip} />
    </Tooltip>
  )
}

function SidebarMenuAction({
  className,
  render,
  showOnHover = false,
  ...props
}: useRender.ComponentProps<"button"> &
  React.ComponentProps<"button"> & {
    showOnHover?: boolean
  }) {
  return useRender({
    defaultTagName: "button",
    props: mergeProps<"button">(
      {
        className: cn(
          "nds-sidebar-menu-action",
          showOnHover && "nds-sidebar-menu-action-hover",
          className
        ),
      },
      props
    ),
    render,
    state: {
      slot: "sidebar-menu-action",
      sidebar: "menu-action",
    },
  })
}

function SidebarMenuBadge({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-menu-badge"
      data-sidebar="menu-badge"
      className={cn("nds-sidebar-menu-badge", className)}
      {...props}
    />
  )
}

function SidebarMenuSkeleton({
  className,
  showIcon = false,
  ...props
}: React.ComponentProps<"div"> & {
  showIcon?: boolean
}) {
  // Random width between 50 to 90%.
  const [width] = React.useState(() => {
    return `${Math.floor(Math.random() * 40) + 50}%`
  })

  return (
    <div
      data-slot="sidebar-menu-skeleton"
      data-sidebar="menu-skeleton"
      className={cn("nds-sidebar-menu-skeleton", className)}
      {...props}
    >
      {showIcon && (
        <Skeleton
          className="nds-sidebar-menu-skeleton-icon"
          data-sidebar="menu-skeleton-icon"
        />
      )}
      <Skeleton
        className="nds-sidebar-menu-skeleton-text"
        data-sidebar="menu-skeleton-text"
        style={
          {
            "--skeleton-width": width,
          } as React.CSSProperties
        }
      />
    </div>
  )
}

function SidebarMenuSub({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="sidebar-menu-sub"
      data-sidebar="menu-sub"
      className={cn("nds-sidebar-menu-sub", className)}
      {...props}
    />
  )
}

function SidebarMenuSubItem({
  className,
  ...props
}: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="sidebar-menu-sub-item"
      data-sidebar="menu-sub-item"
      className={cn("nds-sidebar-menu-sub-item", className)}
      {...props}
    />
  )
}

function SidebarMenuSubButton({
  render,
  size = "md",
  isActive = false,
  className,
  ...props
}: useRender.ComponentProps<"a"> &
  React.ComponentProps<"a"> & {
    size?: "sm" | "md"
    isActive?: boolean
  }) {
  return useRender({
    defaultTagName: "a",
    props: mergeProps<"a">(
      {
        className: cn("nds-sidebar-menu-sub-button", className),
      },
      props
    ),
    render,
    state: {
      slot: "sidebar-menu-sub-button",
      sidebar: "menu-sub-button",
      size,
      active: isActive,
    },
    stateAttributesMapping: stateActiveAsText,
  })
}

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
}
