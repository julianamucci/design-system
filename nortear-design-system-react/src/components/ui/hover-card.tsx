import * as React from "react"
import { PreviewCard as PreviewCardPrimitive } from "@base-ui/react/preview-card"

import { cn } from "@/lib/utils"

type HoverCardProps = PreviewCardPrimitive.Root.Props & { openDelay?: number; closeDelay?: number }
function HoverCard({ ...props }: HoverCardProps) {
  return <PreviewCardPrimitive.Root data-slot="hover-card" {...(props as PreviewCardPrimitive.Root.Props)} />
}

type HoverCardTriggerProps = PreviewCardPrimitive.Trigger.Props & {
  asChild?: boolean
  children?: React.ReactNode
}
function HoverCardTrigger({ asChild, children, ...props }: HoverCardTriggerProps) {
  if (asChild && React.isValidElement(children)) {
    return (
      <PreviewCardPrimitive.Trigger
        data-slot="hover-card-trigger"
        render={children as React.ReactElement}
        {...(props as PreviewCardPrimitive.Trigger.Props)}
      />
    )
  }
  return (
    <PreviewCardPrimitive.Trigger
      data-slot="hover-card-trigger"
      {...(props as PreviewCardPrimitive.Trigger.Props)}
    >
      {children}
    </PreviewCardPrimitive.Trigger>
  )
}

function HoverCardContent({
  className,
  side = "bottom",
  sideOffset = 4,
  align = "center",
  alignOffset = 4,
  ...props
}: PreviewCardPrimitive.Popup.Props &
  Pick<
    PreviewCardPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset"
  >) {
  return (
    <PreviewCardPrimitive.Portal data-slot="hover-card-portal">
      <PreviewCardPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        className="nds-hover-card-positioner"
      >
        <PreviewCardPrimitive.Popup
          data-slot="hover-card-content"
          className={cn(
            "nds-hover-card-content",
            className
          )}
          {...props}
        />
      </PreviewCardPrimitive.Positioner>
    </PreviewCardPrimitive.Portal>
  )
}

export { HoverCard, HoverCardTrigger, HoverCardContent }
