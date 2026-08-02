import * as React from "react"
import { Popover as PopoverPrimitive } from "@base-ui/react/popover"

import { cn } from "@/lib/utils"

function Popover({ ...props }: PopoverPrimitive.Root.Props) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />
}

type PopoverTriggerProps = PopoverPrimitive.Trigger.Props & {
  asChild?: boolean
  children?: React.ReactNode
}
function PopoverTrigger({ asChild, children, ...props }: PopoverTriggerProps) {
  // Sem `nativeButton={false}`: todos os call sites passam <Button>, que é um
  // <button> nativo. Declarar o contrário faz o Base UI logar console.error em
  // dev e aplicar role="button" + handlers de teclado redundantes. A prop só
  // cabe quando o render é outro elemento — ver pagination.tsx, que renderiza <a>.
  if (asChild && React.isValidElement(children)) {
    return (
      <PopoverPrimitive.Trigger
        data-slot="popover-trigger"
        render={children as React.ReactElement}
        {...(props as PopoverPrimitive.Trigger.Props)}
      />
    )
  }
  return (
    <PopoverPrimitive.Trigger
      data-slot="popover-trigger"
      {...(props as PopoverPrimitive.Trigger.Props)}
    >
      {children}
    </PopoverPrimitive.Trigger>
  )
}

function PopoverContent({
  className,
  align = "center",
  alignOffset = 0,
  side = "bottom",
  sideOffset = 4,
  ...props
}: PopoverPrimitive.Popup.Props &
  Pick<
    PopoverPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset"
  >) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        className="nds-popover-positioner"
      >
        <PopoverPrimitive.Popup
          data-slot="popover-content"
          className={cn(
            "nds-popover-content",
            className
          )}
          {...props}
        />
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  )
}

function PopoverHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="popover-header"
      className={cn("nds-popover-header", className)}
      {...props}
    />
  )
}

function PopoverTitle({ className, ...props }: PopoverPrimitive.Title.Props) {
  return (
    <PopoverPrimitive.Title
      data-slot="popover-title"
      className={cn("nds-popover-title", className)}
      {...props}
    />
  )
}

function PopoverDescription({
  className,
  ...props
}: PopoverPrimitive.Description.Props) {
  return (
    <PopoverPrimitive.Description
      data-slot="popover-description"
      className={cn("nds-popover-description", className)}
      {...props}
    />
  )
}

export {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
}
