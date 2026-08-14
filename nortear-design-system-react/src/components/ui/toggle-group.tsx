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

/** A forma pública do valor é a documentada (string no modo exclusivo); o
 *  primitivo trabalha sempre com lista. A conversão mora aqui, num lugar só. */
function toList(value?: string | readonly string[]): string[] | undefined {
  if (value === undefined) return undefined
  return Array.isArray(value) ? [...value] : [value as string]
}

function ToggleGroup({
  className,
  variant,
  size,
  spacing = 0,
  orientation = "horizontal",
  type = "single",
  value,
  defaultValue,
  onValueChange,
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
  const multiple = type === "multiple"

  return (
    <ToggleGroupPrimitive
      role="toolbar"
      data-slot="toggle-group"
      data-variant={variant}
      data-size={size}
      data-spacing={spacing}
      data-orientation={orientation}
      // `orientation` e `multiple` são do primitivo, não decoração: sem o
      // primeiro as setas verticais não movem o foco, e sem o segundo o grupo
      // nasce exclusivo mesmo com `type="multiple"` — os dois falhavam calados.
      orientation={orientation}
      multiple={multiple}
      value={toList(value)}
      defaultValue={toList(defaultValue)}
      // Só o valor: o segundo argumento do primitivo carrega o evento nativo, e
      // a aba Actions estoura ao serializar `event.view` (Window do iframe).
      onValueChange={(next: string[]) => {
        if (multiple) (onValueChange as ((v: string[]) => void) | undefined)?.(next)
        else (onValueChange as ((v: string) => void) | undefined)?.(next[0] ?? "")
      }}
      style={{ "--gap": spacing } as React.CSSProperties}
      className={cn("nds-toggle-group", className)}
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
        // Emendas, cantos e divisores do grupo vivem em toggle-group.css
        // (seletores por data-spacing/data-orientation/data-variant).
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
