import * as React from "react"

import { cn } from "@/lib/utils"

// Estilo via .nds-label (docs/shared/styles/nds/label.css) — inclui os estados
// peer-disabled e [data-disabled] de grupo.
function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      className={cn("nds-label", className)}
      {...props}
    />
  )
}

export { Label }
