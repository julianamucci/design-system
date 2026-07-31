import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"

import { Button } from "@/components/ui/button"
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
  dismissible = false,
  onDismiss,
  dismissLabel = "Fechar alerta",
  children,
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof alertVariants> & {
    /** Renderiza o botão de fechar no canto superior direito. */
    dismissible?: boolean
    /** Disparado uma única vez quando o usuário aciona o botão de fechar. */
    onDismiss?: () => void
    /** aria-label do botão de fechar. */
    dismissLabel?: string
  }) {
  // Fechar remove o alert da tela. Consumidor que quiser modo controlado
  // renderiza condicionalmente por conta própria.
  const [dismissed, setDismissed] = React.useState(false)

  if (dismissed) return null

  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    >
      {children}
      {dismissible && (
        <Button
          variant="ghost"
          size="icon-sm"
          className="nds-alert-dismiss"
          type="button"
          aria-label={dismissLabel}
          data-slot="alert-dismiss"
          onClick={() => {
            setDismissed(true)
            onDismiss?.()
          }}
        >
          <X className="nds-icon" aria-hidden="true" />
        </Button>
      )}
    </div>
  )
}

function AlertTitle({
  className,
  as: As = "h5",
  ...props
}: React.ComponentProps<"h5"> & {
  /**
   * Elemento heading a renderizar. Default `h5`. Passe o nível (`h1`..`h6`)
   * que preserva a hierarquia de headings da página onde o Alert está.
   */
  as?: React.ElementType
}) {
  return (
    // heading/<section>: mesma marcação nas 4 stacks e a que o alert.css
    // documenta (seletores .nds-alert > h1..h6 e .nds-alert > section). <div>
    // perdia a semântica de cabeçalho e de landmark da descrição.
    <As
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
