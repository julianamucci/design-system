import * as React from "react"
import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva("nds-badge", {
  variants: {
    variant: {
      default: "nds-badge-default",
      destructive: "nds-badge-destructive",
      warning: "nds-badge-warning",
      success: "nds-badge-success",
      info: "nds-badge-info",
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

/**
 * Contador da etiqueta — o número à direita do texto, DENTRO do badge.
 *
 * Escolha de forma: SUBCOMPONENTE, e não uma prop `count`. Três razões
 * medidas contra o que a folha define:
 *
 * 1. O conteúdo não é só número — "99+" é a orientação da própria
 *    documentação, e prop numérica obrigaria o primitivo a formatar.
 * 2. A peça não é variante: qualquer variante a aceita. Como prop, cada
 *    combinação teria de existir na assinatura; como filho, a composição fica
 *    onde ela é lida.
 * 3. É a mesma forma que Alert e Card já usam para suas subpartes nesta stack
 *    (`AlertTitle`, `CardHeader`), com `data-slot` explícito.
 *
 * Ao contrário do `Badge`, não passa por `useRender`: a peça é folha, não
 * recebe `render` e não tem estado que vire atributo — um `<span>` com a
 * classe e o slot é tudo que a folha compartilhada pede.
 *
 * O contador é NEUTRO por decisão de contraste (fundo `--secondary`, texto
 * `--foreground`): a cor da variante fica na borda da etiqueta, ao redor.
 */
function BadgeCounter({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="badge-counter"
      className={cn("nds-badge-counter", className)}
      {...props}
    />
  )
}

export { Badge, BadgeCounter, badgeVariants }
