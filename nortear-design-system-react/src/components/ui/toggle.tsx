import { Toggle as TogglePrimitive } from "@base-ui/react/toggle"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// Estilo via .nds-toggle (docs/shared/styles/nds/toggle.css). Variante e
// tamanho são selecionados por data-variant/data-size no CSS — o cva mantém
// apenas a TIPAGEM das variantes (valores vazios de propósito).
const toggleVariants = cva("nds-toggle", {
  variants: {
    variant: {
      default: "",
      outline: "",
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

function Toggle({
  className,
  variant = "default",
  size = "default",
  ...props
}: TogglePrimitive.Props & VariantProps<typeof toggleVariants>) {
  return (
    <TogglePrimitive
      data-slot="toggle"
      // `default` NÃO vira atributo: o CSS trata a ausência como padrão, e o
      // Vanilla — a referência de markup — também o omite. Emitir
      // `data-variant="default"` fazia o mesmo componente ter dois markups
      // conforme a stack, sem nada na tela denunciando.
      data-variant={variant === "default" ? undefined : variant}
      data-size={size === "default" ? undefined : size}
      className={cn(toggleVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Toggle, toggleVariants }
