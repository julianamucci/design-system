"use client"

import type * as React from "react"
import { Menu as MenuPrimitive } from "@base-ui/react/menu"
import { Menubar as MenubarPrimitive } from "@base-ui/react/menubar"

import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CheckIcon, MinusIcon } from "lucide-react"

function Menubar({ className, ...props }: MenubarPrimitive.Props) {
  return (
    <MenubarPrimitive
      data-slot="menubar"
      className={cn(
        "nds-menubar",
        className
      )}
      {...props}
    />
  )
}

/**
 * Um menu da barra — é um `DropdownMenu`, e herda dele o Tab que SAI da barra
 * (C2 do `prd/dropdown-menu.md`): Tab e Shift+Tab num item, do painel ou de um
 * submenu, fecham o menu inteiro e levam o foco ao ponto de tabulação vizinho
 * do gatilho. Como os outros gatilhos têm `tabindex="-1"` (a barra é UMA
 * parada), o destino fica fora da barra. Sem a herança, a base-ui deixava o
 * menu aberto com o foco no gatilho no Shift+Tab. O conserto e a medição estão
 * em `dropdown-menu.tsx`; o portão, em `TabLeavesMenubar` e `TabAtPageEnd`.
 */
function MenubarMenu({ ...props }: React.ComponentProps<typeof DropdownMenu>) {
  return <DropdownMenu data-slot="menubar-menu" {...props} />
}

/**
 * Agrupa itens relacionados — e é OBRIGATÓRIO em volta de um `MenubarLabel`.
 *
 * O rótulo desta stack é o `Menu.GroupLabel` do Base UI, que existe para virar
 * o `aria-labelledby` do grupo: sem um `Menu.Group` ancestral ele não encontra
 * o contexto e LANÇA em tempo de render, derrubando a página inteira. Não é
 * detalhe de estilo — é a diferença entre a docs page abrir e não abrir.
 *
 * (Nem toda stack exige o par: onde a lib aceita rótulo solto, ele é solto. A
 * divergência é de API de framework, e fica registrada aqui.)
 */
function MenubarGroup({
  ...props
}: React.ComponentProps<typeof DropdownMenuGroup>) {
  return <DropdownMenuGroup data-slot="menubar-group" {...props} />
}

function MenubarTrigger({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuTrigger>) {
  return (
    <DropdownMenuTrigger
      data-slot="menubar-trigger"
      className={cn(
        "nds-menubar-trigger",
        className
      )}
      {...props}
    />
  )
}

/**
 * O painel de TOPO de um menu da barra.
 *
 * **`alignOffset: -1`, e o número é medido** (2026-09-19, decisão da dona). O
 * contrato de alinhamento do painel da barra é sobre o TEXTO: o rótulo do
 * primeiro item tem de nascer na mesma coluna do rótulo do gatilho, porque é o
 * que a pessoa vê alinhado. Antes daqui o valor era `-4`, com a justificativa
 * de que alinhava o texto — e a justificativa era falsa. Medido nesta stack,
 * com a barra longe da borda da janela (o SEGUNDO gatilho):
 *
 *   alignOffset   texto do 1º item − texto do gatilho
 *      0                 +1,08
 *     -1                 +0,08   ← alinha
 *     -4  (o de antes)   -2,92
 *
 * Os 0,08 de resíduo são constantes e não são do recuo: a `Playground` é
 * `layout: "centered"`, a barra pousa em coordenada fracionária, e as três
 * medidas diferem entre si por 4,00 exatos. Entre os inteiros, `-1` é o de
 * módulo mínimo — e o único dentro da tolerância de 0,75.
 *
 * A conta fecha e explica o 1: a base-ui ancora a BORDA do painel na borda do
 * gatilho, e do lado de dentro somam-se borda(1) + `padding` do painel
 * (`--spacing-1`, 4) + `padding-inline` do item (`--spacing-2`, 8) = 13, contra
 * o `padding-inline` do gatilho (`--spacing-3`, 12). Sobra exatamente a borda
 * de 1px — no eixo horizontal os dois `padding` quase se cancelam.
 *
 * É a mesma família da D15 (`DropdownMenuSubContent`, `alignOffset: -5`), e são
 * dois números diferentes de propósito: lá o eixo é o VERTICAL e a conta é
 * −(borda + padding do painel); aqui só a borda entra. Mexer num não é mexer no
 * outro.
 *
 * O portão é o último `step` da `Playground` em `menubar.stories.tsx`, que mede
 * texto contra texto com tolerância 0,75 — menor que 1, porque `0` e `-1` ficam
 * a exatamente 1px um do outro.
 */
function MenubarContent({
  className,
  align = "start",
  alignOffset = -1,
  sideOffset = 8,
  ...props
}: React.ComponentProps<typeof DropdownMenuContent>) {
  return (
    <DropdownMenuContent
      data-slot="menubar-content"
      align={align}
      alignOffset={alignOffset}
      sideOffset={sideOffset}
      className={cn(className)}
      {...props}
    />
  )
}

function MenubarItem({
  className,
  inset,
  variant = "default",
  ...props
}: React.ComponentProps<typeof DropdownMenuItem>) {
  return (
    <DropdownMenuItem
      data-slot="menubar-item"
      // `|| undefined` em todo `data-inset` deste arquivo: `data-inset="false"`
      // conta como recuo para a folha, que seleciona por PRESENÇA (`[data-inset]`).
      data-inset={inset || undefined}
      data-variant={variant}
      className={cn(
        className
      )}
      {...props}
    />
  )
}

/**
 * Item de marcação da barra, com o estado MISTO que a lib não tem.
 *
 * A mesma forma do `DropdownMenuCheckboxItem` — o docblock de lá tem a leitura
 * da fonte e as três decisões. `aria-checked="mixed"` só quando misto; a lib
 * recebe `checked={false}`, e o primeiro clique resolve para marcado; o traço é
 * desenhado aqui, porque o indicador da lib só monta com o item marcado.
 */
// Sem `inset`, como no ContextMenu e no DropdownMenu desta stack: a folha só lê
// `[data-inset]` em item, rótulo e sub-gatilho (`dropdown-menu.css:244-248`), e
// a prop aqui era um nome que não recuava nada.
function MenubarCheckboxItem({
  className,
  children,
  checked,
  indeterminate = false,
  ...props
}: MenuPrimitive.CheckboxItem.Props & {
  /** Estado misto: anunciado como `mixed` e desenhado com traço. Controlado. */
  indeterminate?: boolean
}) {
  return (
    <MenuPrimitive.CheckboxItem
      data-slot="menubar-checkbox-item"
      className={cn(
        "nds-dropdown-menu-checkbox-item",
        className
      )}
      {...props}
      checked={indeterminate ? false : checked}
      // PATCH: a11y — o item de marcação da base-ui é de dois estados (ver PATCHES.md#react-dropdown-menu-mixed-checkbox)
      // O misto (D8) entra pelo wrapper, igual ao do DropdownMenu.
      {...(indeterminate ? { "aria-checked": "mixed" as const } : {})}
    >
      <span
        className="nds-dropdown-menu-item-indicator"
        data-slot="menubar-checkbox-item-indicator"
      >
        {indeterminate ? (
          <MinusIcon aria-hidden="true" />
        ) : (
          <MenuPrimitive.CheckboxItemIndicator>
            <CheckIcon />
          </MenuPrimitive.CheckboxItemIndicator>
        )}
      </span>
      {children}
    </MenuPrimitive.CheckboxItem>
  )
}

function MenubarRadioGroup({
  ...props
}: React.ComponentProps<typeof DropdownMenuRadioGroup>) {
  return <DropdownMenuRadioGroup data-slot="menubar-radio-group" {...props} />
}

// Sem `inset`, pelo mesmo motivo do item de marcação acima.
function MenubarRadioItem({
  className,
  children,
  ...props
}: MenuPrimitive.RadioItem.Props) {
  return (
    <MenuPrimitive.RadioItem
      data-slot="menubar-radio-item"
      className={cn(
        "nds-dropdown-menu-radio-item",
        className
      )}
      {...props}
    >
      <span
        className="nds-dropdown-menu-item-indicator"
        data-slot="menubar-radio-item-indicator"
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

function MenubarLabel({
  className,
  inset,
  ...props
}: React.ComponentProps<typeof DropdownMenuLabel> & {
  inset?: boolean
}) {
  return (
    <DropdownMenuLabel
      data-slot="menubar-label"
      data-inset={inset || undefined}
      className={cn(
        className
      )}
      {...props}
    />
  )
}

function MenubarSeparator({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuSeparator>) {
  return (
    <DropdownMenuSeparator
      data-slot="menubar-separator"
      className={cn(className)}
      {...props}
    />
  )
}

function MenubarShortcut({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuShortcut>) {
  return (
    <DropdownMenuShortcut
      data-slot="menubar-shortcut"
      className={cn(
        className
      )}
      {...props}
    />
  )
}

function MenubarSub({
  ...props
}: React.ComponentProps<typeof DropdownMenuSub>) {
  return <DropdownMenuSub data-slot="menubar-sub" {...props} />
}

function MenubarSubTrigger({
  className,
  inset,
  ...props
}: React.ComponentProps<typeof DropdownMenuSubTrigger> & {
  inset?: boolean
}) {
  return (
    <DropdownMenuSubTrigger
      data-slot="menubar-sub-trigger"
      data-inset={inset || undefined}
      className={cn(
        className
      )}
      {...props}
    />
  )
}

function MenubarSubContent({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuSubContent>) {
  return (
    <DropdownMenuSubContent
      data-slot="menubar-sub-content"
      className={cn(className)}
      {...props}
    />
  )
}

export {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarGroup,
  MenubarSeparator,
  MenubarLabel,
  MenubarItem,
  MenubarShortcut,
  MenubarCheckboxItem,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSub,
  MenubarSubTrigger,
  MenubarSubContent,
}
