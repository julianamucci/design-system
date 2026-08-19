import { ScrollArea as ScrollAreaPrimitive } from "@base-ui/react/scroll-area"

import { cn } from "@/lib/utils"

// ─── ScrollArea ───────────────────────────────────────────────────────────────
//
// SEM `type` e SEM `scrollHideDelay`. As duas props estavam declaradas aqui e
// não existem em `@base-ui/react/scroll-area` — conferido no
// `root/ScrollAreaRoot.d.ts`, cuja única prop própria é `overflowEdgeThreshold`.
// Declaradas, elas caíam no `{...props}` e chegavam ao `<div>`: `scrollHideDelay`
// virava erro de console do React a cada render e `type` virava atributo inválido
// no elemento. Prop que a lib ignora em silêncio é contrato falso — quem passava
// `type="always"` recebia o comportamento padrão e não tinha como saber.
//
// Nesta stack a barra é montada sempre que há transbordo, e o estado de ponteiro
// e de rolagem é publicado como `data-hovering` / `data-scrolling` na própria
// barra, para o CSS decidir a aparência. Não há tempo de espera a configurar.

// A altura é obrigatória: sem limite não há transbordo, e sem transbordo não há
// rolagem. `size` é a escada de janela (`--box-height-*`), e existe porque a
// alternativa praticada era cada página escolher o próprio número em `style`
// inline — 60 alturas cravadas, 20 valores distintos para dizer a mesma coisa.
// Altura fora da escada continua possível pela custom property `--box-height`,
// que a folha governa.
type ScrollAreaSize = "xs" | "sm" | "md" | "lg" | "xl";

function ScrollArea({
  className,
  children,
  size,
  ...props
}: ScrollAreaPrimitive.Root.Props & { size?: ScrollAreaSize }) {
  return (
    <ScrollAreaPrimitive.Root
      data-slot="scroll-area"
      data-size={size}
      className={cn("nds-scroll-area", className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        data-slot="scroll-area-viewport"
        className="nds-scroll-area-viewport"
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  )
}

function ScrollBar({
  className,
  orientation = "vertical",
  ...props
}: ScrollAreaPrimitive.Scrollbar.Props) {
  return (
    <ScrollAreaPrimitive.Scrollbar
      data-slot="scroll-area-scrollbar"
      data-orientation={orientation}
      orientation={orientation}
      className={cn("nds-scroll-area-scrollbar", className)}
      {...props}
    >
      <ScrollAreaPrimitive.Thumb
        data-slot="scroll-area-thumb"
        className="nds-scroll-area-thumb"
      />
    </ScrollAreaPrimitive.Scrollbar>
  )
}

export { ScrollArea, ScrollBar }
