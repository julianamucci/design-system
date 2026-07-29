import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const alertVariants = cva("nds-alert", {
  variants: {
    variant: {
      default: "",
      destructive: "nds-alert-destructive",
      success: "nds-alert-success",
      warning: "nds-alert-warning",
      info: "nds-alert-info",
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  )
}

function AlertTitle({ className, ...props }: React.ComponentProps<"h5">) {
  return (
    // <h5>/<section>: mesma marcação nas 4 stacks e a que o alert.css documenta
    // (seletores .nds-alert > h1..h6 e .nds-alert > section). <div> perdia a
    // semântica de cabeçalho e de landmark da descrição.
    <h5
      data-slot="alert-title"
      className={cn("nds-alert-title", className)}
      {...props}
    />
  )
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"section">) {
  return (
    <section
      data-slot="alert-description"
      className={cn("nds-alert-description", className)}
      {...props}
    />
  )
}

function AlertAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-action"
      className={cn("nds-alert-action", className)}
      {...props}
    />
  )
}

export { Alert, AlertTitle, AlertDescription, AlertAction }
