"use client"

import * as React from "react"
import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip"

import { cn } from "@/lib/utils"
//
// ─── Acessibilidade: a decisão, medida nas cinco stacks em 2026-09-02 ────────
//
// 1. Abre por FOCO além de ponteiro, e o foco abre sem espera (WCAG 2.1.1).
// 2. Escape fecha sem mover o foco (WCAG 1.4.13, Dismissible).
// 3. Pairável e persistente por COORDENADA: a folha dá `pointer-events: none`
//    ao balão, então quem segura a abertura é a área de tolerância entre
//    gatilho e balão, e não um hover no nó (WCAG 1.4.13, Hoverable).
// 4. O gatilho é DESCRITO pelo balão (`aria-describedby`, e só enquanto o balão
//    existe), nunca NOMEADO por ele. Gatilho icon-only carrega `aria-label`
//    próprio: em touch não há hover.
// 5. Nada de região viva — o balão é `role="tooltip"`, e o anúncio chega pela
//    descrição do gatilho, ao focar.
//
// Texto canônico, com o porquê de cada uma: cabeçalho do tooltip do Vanilla,
// que é a referência de comportamento.
//
// Mecanismo nesta stack: os primitivos do `@base-ui/react`, com polígono de
// segurança do floating-ui. A ponte `id`/`aria-describedby` é montada aqui,
// porque a lib não a entrega — ver o bloco logo abaixo.
//

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

/**
 * Altura da seta, em px — espelha o `height: 0.3125rem` de `.nds-tooltip-arrow`
 * na folha compartilhada. Muda lá, muda aqui.
 */
const ARROW_HEIGHT = 5

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
  // O base-ui aceita `sideOffset` como número OU como função do contexto de
  // posicionamento; os dois ramos existem porque somar ao tipo união não
  // compila, e engolir o ramo de função apagaria em silêncio um offsetComArrow
  // que quem chama tenha calculado.
  const offsetComArrow: NonNullable<TooltipPrimitive.Positioner.Props["sideOffset"]> =
    typeof sideOffset === "function"
      ? (dados) => sideOffset(dados) + ARROW_HEIGHT
      : sideOffset + ARROW_HEIGHT
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        side={side}
        // `sideOffset + ARROW_HEIGHT`: o base-ui usa o valor cru como distância
        // até o positioner e NÃO desconta a seta, que vive no vão — reka-ui e
        // bits-ui somam a altura da seta por conta própria (`mainAxis:
        // sideOffset + arrowHeight`). Sem somar aqui, os mesmos 4 que o
        // conteúdo compartilhado documenta dariam 4px de folga em duas stacks e
        // 1px de SOBREPOSIÇÃO nesta.
        sideOffset={offsetComArrow}
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
