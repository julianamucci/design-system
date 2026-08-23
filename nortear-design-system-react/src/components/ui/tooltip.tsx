"use client"

import * as React from "react"
import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip"

import { cn } from "@/lib/utils"

/**
 * Liga o gatilho ao balão — o que o `@base-ui/react` não faz.
 *
 * As outras quatro stacks entregam a associação sozinhas: `reka-ui` e `bits-ui`
 * escrevem `aria-describedby` no gatilho enquanto o balão existe, `radix-ng`
 * idem, e a factory do Vanilla — referência cross-stack — faz o mesmo à mão. No
 * base-ui não há nada: o `TooltipTrigger` monta `hoverProps`, `focusProps` e um
 * `id` próprio, e o `triggerProps` do store nunca é preenchido para o tooltip.
 * Sem esta ponte, o texto do balão é invisível para o leitor de tela — que é o
 * único motivo de o componente existir para quem não vê o balão.
 *
 * O par `id`/`aria-describedby` só vale enquanto ABERTO: um `aria-describedby`
 * apontando para id ausente é violação de `aria-valid-attr-value` no axe.
 */
const TooltipDescriptionContext = React.createContext<{
  id: string
  open: boolean
} | null>(null)

function TooltipProvider({
  delay = 0,
  ...props
}: TooltipPrimitive.Provider.Props) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delay={delay}
      {...props}
    />
  )
}

function Tooltip({
  open,
  defaultOpen,
  onOpenChange,
  children,
  ...props
}: TooltipPrimitive.Root.Props) {
  // `useId` devolve `«r0»` no React 19 — válido em `id`, mas ilegível num
  // seletor. Normalizar mantém o id utilizável em `querySelector` também.
  const id = `tooltip-${React.useId().replace(/[^a-zA-Z0-9_-]/g, "")}`
  // Espelho local do estado: o base-ui não expõe contexto público de leitura, e
  // o gatilho precisa saber se o balão existe para decidir o describedby.
  const [openInterno, setOpenInterno] = React.useState(defaultOpen ?? false)
  const isOpen = open ?? openInterno

  const handleOpenChange = React.useCallback<
    NonNullable<TooltipPrimitive.Root.Props["onOpenChange"]>
  >(
    (next, detalhes) => {
      setOpenInterno(next)
      onOpenChange?.(next, detalhes)
    },
    [onOpenChange]
  )

  const value = React.useMemo(() => ({ id, open: isOpen }), [id, isOpen])

  return (
    <TooltipDescriptionContext.Provider value={value}>
      <TooltipPrimitive.Root
        data-slot="tooltip"
        open={open}
        defaultOpen={defaultOpen}
        onOpenChange={handleOpenChange}
        {...props}
      >
        {children}
      </TooltipPrimitive.Root>
    </TooltipDescriptionContext.Provider>
  )
}

function TooltipTrigger({ ...props }: TooltipPrimitive.Trigger.Props) {
  const descricao = React.useContext(TooltipDescriptionContext)
  return (
    <TooltipPrimitive.Trigger
      data-slot="tooltip-trigger"
      aria-describedby={descricao?.open ? descricao.id : undefined}
      {...props}
    />
  )
}

function TooltipContent({
  className,
  side = "top",
  sideOffset = 4,
  align = "center",
  alignOffset = 0,
  children,
  ...props
}: TooltipPrimitive.Popup.Props &
  Pick<
    TooltipPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset"
  >) {
  const descricao = React.useContext(TooltipDescriptionContext)
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        className="nds-tooltip-positioner"
      >
        <TooltipPrimitive.Popup
          data-slot="tooltip-content"
          // role="tooltip": o base-ui não escreve papel nenhum no popup — o
          // `popupProps` do Root só carrega dismiss e clientPoint. Sem isto o
          // balão é um <div> qualquer para o leitor de tela. Vanilla
          // (referência cross-stack), Svelte e Angular já emitem o papel.
          role="tooltip"
          id={descricao?.id}
          className={cn(
            "nds-tooltip-content",
            className
          )}
          {...props}
        >
          {children}
          <TooltipPrimitive.Arrow className="nds-tooltip-arrow" />
        </TooltipPrimitive.Popup>
      </TooltipPrimitive.Positioner>
    </TooltipPrimitive.Portal>
  )
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
