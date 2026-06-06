"use client"

import * as React from "react"
import { Toggle as TogglePrimitive } from "@base-ui/react/toggle"
import { ToggleGroup as ToggleGroupPrimitive } from "@base-ui/react/toggle-group"
import { type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { toggleVariants } from "@/components/ui/toggle"

const ToggleGroupContext = React.createContext<
  VariantProps<typeof toggleVariants> & {
    spacing?: number
    orientation?: "horizontal" | "vertical"
  }
>({
  size: "default",
  variant: "default",
  spacing: 0,
  orientation: "horizontal",
})

function ToggleGroup({
  className,
  variant,
  size,
  spacing = 0,
  orientation = "horizontal",
  children,
  ...props
}: Omit<ToggleGroupPrimitive.Props, "value" | "defaultValue" | "onValueChange"> &
  VariantProps<typeof toggleVariants> & {
    spacing?: number
    orientation?: "horizontal" | "vertical"
    type?: "single" | "multiple"
    value?: string | readonly string[]
    defaultValue?: string | readonly string[]
    onValueChange?: ((value: string) => void) | ((value: string[]) => void)
  }) {
  return (
    <ToggleGroupPrimitive
      role="toolbar"
      data-slot="toggle-group"
      data-variant={variant}
      data-size={size}
      data-spacing={spacing}
      data-orientation={orientation}
      style={{ "--gap": spacing } as React.CSSProperties}
      className={cn(
        // PATCH: theme — rounded via --radius-button (em vez de rounded-lg hardcoded) para respeitar tema (ver PATCHES.md#toggle-radius-token)
        "group/toggle-group flex w-fit flex-row items-center gap-[--spacing(var(--gap))] rounded-(--radius-button) data-vertical:flex-col data-vertical:items-stretch",
        className
      )}
      {...(props as ToggleGroupPrimitive.Props)}
    >
      <ToggleGroupContext.Provider
        value={{ variant, size, spacing, orientation }}
      >
        {children}
      </ToggleGroupContext.Provider>
    </ToggleGroupPrimitive>
  )
}

function ToggleGroupItem({
  className,
  children,
  variant = "default",
  size = "default",
  ...props
}: TogglePrimitive.Props & VariantProps<typeof toggleVariants>) {
  const context = React.useContext(ToggleGroupContext)

  return (
    <TogglePrimitive
      data-slot="toggle-group-item"
      data-variant={context.variant || variant}
      data-size={context.size || size}
      data-spacing={context.spacing}
      className={cn(
        // PATCH: theme — rounded-{l,r,t,b}-(--radius-button) em vez de rounded-{l,r,t,b}-lg (ver PATCHES.md#toggle-radius-token)
        "shrink-0 group-data-[spacing=0]/toggle-group:rounded-none group-data-[spacing=0]/toggle-group:px-2 focus:z-10 focus-visible:z-10 group-data-[spacing=0]/toggle-group:has-data-[icon=inline-end]:pr-1.5 group-data-[spacing=0]/toggle-group:has-data-[icon=inline-start]:pl-1.5 group-data-horizontal/toggle-group:data-[spacing=0]:first:rounded-l-(--radius-button) group-data-vertical/toggle-group:data-[spacing=0]:first:rounded-t-(--radius-button) group-data-horizontal/toggle-group:data-[spacing=0]:last:rounded-r-(--radius-button) group-data-vertical/toggle-group:data-[spacing=0]:last:rounded-b-(--radius-button) group-data-horizontal/toggle-group:data-[spacing=0]:data-[variant=outline]:border-l-0 group-data-vertical/toggle-group:data-[spacing=0]:data-[variant=outline]:border-t-0 group-data-horizontal/toggle-group:data-[spacing=0]:data-[variant=outline]:first:border-l group-data-vertical/toggle-group:data-[spacing=0]:data-[variant=outline]:first:border-t",
        toggleVariants({
          variant: context.variant || variant,
          size: context.size || size,
        }),
        className
      )}
      {...props}
    >
      {children}
    </TogglePrimitive>
  )
}

export { ToggleGroup, ToggleGroupItem }
