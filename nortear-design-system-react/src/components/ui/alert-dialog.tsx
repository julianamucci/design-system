import * as React from "react"
import { AlertDialog as AlertDialogPrimitive } from "@base-ui/react/alert-dialog"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

function AlertDialog({ ...props }: AlertDialogPrimitive.Root.Props) {
  return <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />
}

type AlertDialogTriggerProps = AlertDialogPrimitive.Trigger.Props & {
  asChild?: boolean
  children?: React.ReactNode
}
function AlertDialogTrigger({
  asChild,
  children,
  ...props
}: AlertDialogTriggerProps) {
  if (asChild && React.isValidElement(children)) {
    return (
      <AlertDialogPrimitive.Trigger
        data-slot="alert-dialog-trigger"
        render={children as React.ReactElement}
        {...(props as AlertDialogPrimitive.Trigger.Props)}
      />
    )
  }
  return (
    <AlertDialogPrimitive.Trigger
      data-slot="alert-dialog-trigger"
      {...(props as AlertDialogPrimitive.Trigger.Props)}
    >
      {children}
    </AlertDialogPrimitive.Trigger>
  )
}

function AlertDialogPortal({ ...props }: AlertDialogPrimitive.Portal.Props) {
  return (
    <AlertDialogPrimitive.Portal data-slot="alert-dialog-portal" {...props} />
  )
}

function AlertDialogOverlay({
  className,
  ...props
}: AlertDialogPrimitive.Backdrop.Props) {
  return (
    <AlertDialogPrimitive.Backdrop
      data-slot="alert-dialog-overlay"
      className={cn(
        "nds-alert-dialog-overlay",
        className
      )}
      {...props}
    />
  )
}

function AlertDialogContent({
  className,
  ...props
}: AlertDialogPrimitive.Popup.Props) {
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      {/*
        O primitivo desta stack isola o resto do documento com
        `inert`/`aria-hidden` e NÃO emite `aria-modal` (conferido em
        node_modules). Quem cumpre o contrato de markup do design system é este
        wrapper. Aqui o atributo é incondicional: a raiz do alert dialog não
        expõe `modal` — ela é sempre modal, por definição do papel.
      */}
      <AlertDialogPrimitive.Popup
        data-slot="alert-dialog-content"
        className={cn(
          "nds-alert-dialog-content",
          className
        )}
        aria-modal="true"
        {...props}
      />
    </AlertDialogPortal>
  )
}

function AlertDialogHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-header"
      className={cn(
        "nds-alert-dialog-header",
        className
      )}
      {...props}
    />
  )
}

function AlertDialogFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-footer"
      className={cn(
        "nds-alert-dialog-footer",
        className
      )}
      {...props}
    />
  )
}

function AlertDialogMedia({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-media"
      className={cn(
        "nds-alert-dialog-media",
        className
      )}
      {...props}
    />
  )
}

function AlertDialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Title>) {
  return (
    <AlertDialogPrimitive.Title
      data-slot="alert-dialog-title"
      className={cn(
        "nds-alert-dialog-title",
        className
      )}
      {...props}
    />
  )
}

function AlertDialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Description>) {
  return (
    <AlertDialogPrimitive.Description
      data-slot="alert-dialog-description"
      className={cn(
        "nds-alert-dialog-description",
        className
      )}
      {...props}
    />
  )
}

// O botão de ação confirma E fecha o diálogo — por isso renderiza via
// `Close`, igual ao Cancel. `variant`/`size` ficam sem default aqui para
// herdarem os do Button. O `onClick` do consumidor é mesclado pelo Base UI
// (roda antes do fechamento), não sobrescrito.
function AlertDialogAction({
  className,
  variant,
  size,
  ...props
}: AlertDialogPrimitive.Close.Props &
  Pick<React.ComponentProps<typeof Button>, "variant" | "size">) {
  return (
    <AlertDialogPrimitive.Close
      data-slot="alert-dialog-action"
      className={cn(className)}
      render={<Button variant={variant} size={size} />}
      {...props}
    />
  )
}

function AlertDialogCancel({
  className,
  variant = "outline",
  size = "default",
  ...props
}: AlertDialogPrimitive.Close.Props &
  Pick<React.ComponentProps<typeof Button>, "variant" | "size">) {
  return (
    <AlertDialogPrimitive.Close
      data-slot="alert-dialog-cancel"
      className={cn(className)}
      render={<Button variant={variant} size={size} />}
      {...props}
    />
  )
}

export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
}
