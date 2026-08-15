import { cn } from "@/lib/utils"

// A caixa do esqueleto vem de `data-shape` / `data-width` (ver
// docs/shared/styles/nds/skeleton.css), nunca de altura cravada: altura é
// resultado de padding + tipografia, para o bloco crescer junto quando a
// pessoa aumenta a fonte do navegador (guideline 12, WCAG 1.4.4).
//
// `aria-hidden` sai marcado de fábrica — o placeholder é ruído para leitor de
// tela, e quem anuncia o carregamento é a região que o contém.
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn("nds-skeleton", className)}
      {...props}
    />
  )
}

export { Skeleton }
