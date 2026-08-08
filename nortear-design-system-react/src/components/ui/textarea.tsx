import type * as React from "react"

import { cn } from "@/lib/utils"

// Estilo via .nds-textarea (docs/shared/styles/nds/textarea.css).
function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn("nds-textarea", className)}
      {...props}
    />
  )
}

export { Textarea }
