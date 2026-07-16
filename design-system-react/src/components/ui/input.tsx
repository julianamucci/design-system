import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

// Estilo via .nds-input (docs/shared/styles/nds/input.css) — estados hover/
// focus/disabled/aria-invalid e input[type=file] no CSS. Zero Tailwind.
// Altura resulta de padding + line-height (WCAG 1.4.4), não de token fixo.
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn("nds-input", className)}
      {...props}
    />
  )
}

export { Input }
