import { NavigationMenu as NavigationMenuPrimitive } from "@base-ui/react/navigation-menu"
import { cva } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { ChevronDownIcon } from "lucide-react"

function NavigationMenu({
  align = "start",
  indicator = false,
  className,
  children,
  ...props
}: NavigationMenuPrimitive.Root.Props &
  Pick<NavigationMenuPrimitive.Positioner.Props, "align"> & {
    defaultValue?: string
    /**
     * Espera em ms antes de abrir o painel quando o ponteiro entra no gatilho.
     *
     * O nome é o da lib desta stack. A tipagem daqui anunciava `delayDuration`,
     * que a lib não conhece: a prop atravessava o componente e ia parar no DOM
     * como atributo desconhecido, com o React reclamando no console e a espera
     * ficando sempre no padrão.
     */
    delay?: number
    /** Espera em ms antes de fechar depois que o ponteiro sai da barra. */
    closeDelay?: number
    orientation?: "horizontal" | "vertical"
    /**
     * Seta apontando para o gatilho ativo.
     *
     * Nasce desligada: é feedback redundante (o gatilho já muda de fundo e o
     * chevron já gira), então é escolha de quem compõe. Sem esta prop o
     * indicador não tinha como ser renderizado por ninguém — a peça existia
     * exportada e nenhuma story a alcançava.
     */
    indicator?: boolean
  }) {
  return (
    <NavigationMenuPrimitive.Root
      data-slot="navigation-menu"
      className={cn(
        "nds-navigation-menu",
        className
      )}
      {...props}
    >
      {children}
      {/* Barra horizontal abre para baixo; barra vertical abre para o lado.
          Derivado da orientação em vez de virar mais uma prop: abrir para baixo
          numa coluna cobriria os próprios itens seguintes, e nunca é o que se
          quer. */}
      <NavigationMenuPositioner
        align={align}
        indicator={indicator}
        side={props.orientation === "vertical" ? "right" : "bottom"}
      />
    </NavigationMenuPrimitive.Root>
  )
}

function NavigationMenuList({
  className,
  ...props
}: React.ComponentPropsWithRef<typeof NavigationMenuPrimitive.List>) {
  return (
    <NavigationMenuPrimitive.List
      data-slot="navigation-menu-list"
      className={cn(
        "nds-navigation-menu-list",
        className
      )}
      {...props}
    />
  )
}

function NavigationMenuItem({
  className,
  ...props
}: React.ComponentPropsWithRef<typeof NavigationMenuPrimitive.Item>) {
  return (
    <NavigationMenuPrimitive.Item
      data-slot="navigation-menu-item"
      className={cn("nds-navigation-menu-item", className)}
      {...props}
    />
  )
}

const navigationMenuTriggerStyle = cva("nds-navigation-menu-trigger")

function NavigationMenuTrigger({
  className,
  children,
  ...props
}: NavigationMenuPrimitive.Trigger.Props) {
  return (
    <NavigationMenuPrimitive.Trigger
      data-slot="navigation-menu-trigger"
      className={cn(navigationMenuTriggerStyle(), className)}
      {...props}
    >
      {children}{" "}
      <ChevronDownIcon className="nds-navigation-menu-chevron" aria-hidden="true" />
    </NavigationMenuPrimitive.Trigger>
  )
}

function NavigationMenuContent({
  className,
  ...props
}: NavigationMenuPrimitive.Content.Props) {
  return (
    <NavigationMenuPrimitive.Content
      data-slot="navigation-menu-content"
      className={cn("nds-navigation-menu-popup-content", className)}
      {...props}
    />
  )
}

function NavigationMenuPositioner({
  className,
  side = "bottom",
  sideOffset = 8,
  align = "start",
  alignOffset = 0,
  indicator = false,
  ...props
}: NavigationMenuPrimitive.Positioner.Props & { indicator?: boolean }) {
  return (
    <NavigationMenuPrimitive.Portal>
      <NavigationMenuPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        className={cn("nds-navigation-menu-positioner", className)}
        {...props}
      >
        {/* render <div>: o <nav> default do Popup é um landmark sem rótulo que
            colide no axe (landmark-unique) quando há mais de um popup aberto;
            o Vanilla (referência) não rende <nav> no popup. */}
        <NavigationMenuPrimitive.Popup
          render={<div />}
          className="nds-navigation-menu-popup"
        >
          <NavigationMenuPrimitive.Viewport className="nds-navigation-menu-viewport" />
        </NavigationMenuPrimitive.Popup>
        {indicator ? <NavigationMenuIndicator /> : null}
      </NavigationMenuPrimitive.Positioner>
    </NavigationMenuPrimitive.Portal>
  )
}

function NavigationMenuLink({
  className,
  ...props
}: NavigationMenuPrimitive.Link.Props) {
  return (
    <NavigationMenuPrimitive.Link
      data-slot="navigation-menu-link"
      className={cn("nds-navigation-menu-link", className)}
      {...props}
    />
  )
}

/**
 * Destino DENTRO do painel.
 *
 * Classe diferente da do link da barra porque o desenho é outro: o da barra é
 * uma pílula de uma linha (`inline-flex` + `white-space: nowrap`); este é um
 * bloco com título e, às vezes, uma linha de descrição. É a mesma separação que
 * o Vanilla faz — e sem ela os painéis de mega-menu desta stack empurravam
 * título e descrição para dentro de uma pílula que não quebra linha.
 */
function NavigationMenuChild({
  className,
  ...props
}: NavigationMenuPrimitive.Link.Props) {
  return (
    <NavigationMenuPrimitive.Link
      data-slot="navigation-menu-child"
      // Fecha o painel ao ser escolhido, SEMPRE — navegar é sair da página, e um
      // painel que sobrevive ao clique fica pendurado sobre a página seguinte.
      // A lib nasce com isto DESLIGADO, então sem esta linha o painel do
      // mega-menu continuava aberto depois de escolher um destino.
      closeOnClick
      className={cn("nds-navigation-menu-child", className)}
      {...props}
    />
  )
}

/**
 * Seta apontando para o gatilho ativo.
 *
 * Sobre `Arrow`, não `Icon`: `Icon` é o slot do chevron DENTRO do gatilho, e é
 * onde este componente vivia — o "indicador" nascia dentro do botão, sem
 * posicionamento nenhum, enquanto o CSS o descrevia flutuando sob a barra.
 * `Arrow` é a peça que o floating-ui posiciona, e por isso mora no positioner.
 *
 * Decorativa: quem lê a tela já tem `aria-expanded` no gatilho.
 */
function NavigationMenuIndicator({
  className,
  ...props
}: React.ComponentPropsWithRef<typeof NavigationMenuPrimitive.Arrow>) {
  return (
    <NavigationMenuPrimitive.Arrow
      data-slot="navigation-menu-indicator"
      aria-hidden="true"
      className={cn("nds-navigation-menu-indicator", className)}
      {...props}
    >
      <div className="nds-navigation-menu-indicator-arrow" />
    </NavigationMenuPrimitive.Arrow>
  )
}

export {
  NavigationMenu,
  NavigationMenuChild,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
  NavigationMenuPositioner,
}
