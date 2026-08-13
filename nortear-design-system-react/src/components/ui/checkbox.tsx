import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox"

import { cn } from "@/lib/utils"
import { CheckIcon, MinusIcon } from "lucide-react"

// Estilo via .nds-checkbox (docs/shared/styles/nds/checkbox.css) — estados
// base-ui (data-checked/data-disabled) e hit-area expandida no CSS.
//
// `indeterminate` é lido aqui (não só repassado) porque o Indicator do
// base-ui não desenha um traço sozinho no estado misto — ele mantém o mesmo
// filho montado. Sem essa leitura, o indeterminate pintava o fundo certo
// (CSS) mas exibia a marca de seleção em vez do traço.
function Checkbox({ className, indeterminate, ...props }: CheckboxPrimitive.Root.Props) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn("nds-checkbox", className)}
      indeterminate={indeterminate}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="nds-checkbox-indicator"
      >
        {indeterminate ? <MinusIcon /> : <CheckIcon />}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
