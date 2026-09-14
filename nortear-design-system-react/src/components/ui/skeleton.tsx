import { cn } from "@/lib/utils"

// A caixa do esqueleto vem de `data-shape` / `data-width` (ver
// docs/shared/styles/nds/skeleton.css), nunca de altura cravada: altura é
// resultado de padding + tipografia, para o bloco crescer junto quando a
// pessoa aumenta a fonte do navegador (guideline 12, WCAG 1.4.4).
//
// `aria-hidden` sai marcado de fábrica e NÃO é sobrescrevível — o placeholder é
// ruído para leitor de tela, e quem anuncia o carregamento é a região que o
// contém. Por isso os atributos fixos vêm DEPOIS do espalhamento: em JSX quem
// escreve por último vence.
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      {...props}
      data-slot="skeleton"
      aria-hidden="true"
      className={cn("nds-skeleton", className)}
    />
  )
}

/**
 * A região que ESPERA o conteúdo — e que é quem anuncia a espera.
 *
 * Peça do design system desde 2026-09-13, por decisão da dona: as cinco docs
 * pages montavam este contêiner à mão e tinham divergido em cinco formas (uma
 * delas sem `role="status"`). Regra que cada consumidor executa por conta é
 * regra que se perde no quinto consumidor.
 *
 * Os três atributos andam juntos, e cada um tem motivo próprio:
 * - `role="status"` — `aria-busy` sozinho num `div` sem papel não é anunciado, e
 *   nome acessível sem papel é atributo proibido;
 * - `aria-busy="true"` — é o estado, e é FIXO: a região não alterna para
 *   `false`. Quando o conteúdo chega, ela SAI e o conteúdo entra no lugar dela
 *   (decisão da dona, 2026-09-14). Região vazia deixada para trás continuaria
 *   dizendo que algo carrega;
 * - `label` obrigatório — uma região `status` sem nome não é alcançável pela
 *   lista de regiões, e "carregando" sem dizer o quê não orienta.
 *
 * Papel, estado e nome NÃO são sobrescrevíveis: saem do tipo das props e são
 * escritos depois do espalhamento, então nem um `role`/`aria-busy` passado por
 * cast chega ao DOM.
 *
 * `status` já é região viva por definição, então NÃO se acrescenta `aria-live`
 * aqui, e nem uma segunda região dentro desta: uma região por BLOCO, nunca por
 * peça — cinco linhas de esqueleto numa lista são uma espera só.
 *
 * Não tem CSS próprio de propósito: o layout é de quem compõe, por `className`
 * (`nds-stack`, `nds-grid`, `nds-cluster`).
 */
type SkeletonRegionProps = Omit<
  React.ComponentProps<"div">,
  "role" | "aria-busy" | "aria-label"
> & { label: string }

function SkeletonRegion({ label, className, children, ...props }: SkeletonRegionProps) {
  return (
    <div
      {...props}
      data-slot="skeleton-region"
      role="status"
      aria-busy="true"
      aria-label={label}
      className={className}
    >
      {children}
    </div>
  )
}

export { Skeleton, SkeletonRegion }
export type { SkeletonRegionProps }
