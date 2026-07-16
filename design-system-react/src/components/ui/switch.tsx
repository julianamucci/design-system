import { Switch as SwitchPrimitive } from "@base-ui/react/switch"

import { cn } from "@/lib/utils"

// Estilo via .nds-switch (docs/shared/styles/nds/switch.css). O tamanho é
// controlado por data-size (default | sm) no CSS compartilhado. Zero Tailwind.
function Switch({
  className,
  size = "default",
  ...props
}: SwitchPrimitive.Root.Props & {
  size?: "sm" | "default"
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn("nds-switch", className)}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="nds-switch-thumb"
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
