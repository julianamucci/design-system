import { Separator as SeparatorPrimitive } from "@base-ui/react/separator"

import { cn } from "@/lib/utils"

function Separator({
  className,
  orientation = "horizontal",
  decorative = true,
  ...props
}: SeparatorPrimitive.Props & { decorative?: boolean }) {
  const a11yProps = decorative
    ? { role: "none" as const, "aria-hidden": true }
    : { role: "separator" as const, "aria-orientation": orientation }
  return (
    <SeparatorPrimitive
      data-slot="separator"
      orientation={orientation}
      data-orientation={orientation}
      className={cn("nds-separator", className)}
      {...a11yProps}
      {...props}
    />
  )
}

export { Separator }
