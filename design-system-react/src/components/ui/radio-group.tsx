import { Radio as RadioPrimitive } from "@base-ui/react/radio"
import { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group"

import { cn } from "@/lib/utils"

// Estilo via .nds-radio-* (docs/shared/styles/nds/radio-group.css). O círculo
// interno do indicator é desenhado via CSS (::after) — o base-ui desmonta o
// indicator quando unchecked, então não há filho aqui. Zero Tailwind.
function RadioGroup({ className, ...props }: RadioGroupPrimitive.Props) {
  return (
    <RadioGroupPrimitive
      data-slot="radio-group"
      className={cn("nds-radio-group", className)}
      {...props}
    />
  )
}

function RadioGroupItem({ className, ...props }: RadioPrimitive.Root.Props) {
  return (
    <RadioPrimitive.Root
      data-slot="radio-group-item"
      className={cn("nds-radio-item", className)}
      {...props}
    >
      <RadioPrimitive.Indicator
        data-slot="radio-group-indicator"
        className="nds-radio-indicator"
      />
    </RadioPrimitive.Root>
  )
}

export { RadioGroup, RadioGroupItem }
