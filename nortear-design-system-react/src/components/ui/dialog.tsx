import * as React from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { XIcon } from "lucide-react"

/*
 * ─── Dialog ─────────────────────────────────────────────────────────────────
 *
 * Diálogo modal comum. O bloco canônico da decisão de acessibilidade (dez
 * itens, medidos na fonte das cinco libs) está no cabeçalho do `dialog.ts` do
 * Vanilla; aqui fica a versão curta mais o mecanismo desta stack.
 *
 * Prende o foco, trava a rolagem da página, fecha por Escape E por clique no
 * véu, e devolve o foco ao gatilho. Mecanismo: `useDialogRoot` chama
 * `useScrollLock(open && modal === true)`, `useDismiss` com
 * `escapeKey: isTopmost`, e o `FloatingFocusManager` do Popup prende o foco
 * enquanto `modal !== false`. O `DialogTrigger` do primitivo emite
 * `aria-haspopup="dialog"` e `aria-expanded` sozinho.
 *
 * ─── O que o separa do AlertDialog ──────────────────────────────────────────
 *
 * Papel: `dialog` aqui, `alertdialog` lá — o leitor de tela anuncia o
 * segundo com urgência e lê a descrição junto do título.
 *
 * Dispensa: aqui o clique no véu FECHA; no AlertDialog não fecha, porque a
 * decisão é crítica e exige escolha explícita. No primitivo desta stack isso
 * não é configuração: `useRenderDialogRoot` liga
 * `disablePointerDismissal` quando o modo é `alert-dialog`.
 *
 * Escape: fecha NOS DOIS, e no AlertDialog equivale a cancelar. Tirar a única
 * saída de teclado seria pior que o risco de dispensa acidental — que é
 * justamente o que o clique-fora bloqueado já cobre.
 */

// O primitivo desta stack isola o resto do documento com `inert`/`aria-hidden`
// e NÃO emite `aria-modal` (conferido em node_modules). O contrato de markup do
// design system promete o atributo, então quem o emite é este wrapper — e para
// isso o Content precisa saber se a raiz é modal. O valor `'trap-focus'` prende
// o foco mas deixa a página interativa: não é modal para o leitor de tela.
const DialogModalContext = React.createContext<boolean | "trap-focus">(true)

function Dialog({ ...props }: DialogPrimitive.Root.Props) {
  return (
    <DialogModalContext.Provider value={props.modal ?? true}>
      <DialogPrimitive.Root data-slot="dialog" {...props} />
    </DialogModalContext.Provider>
  )
}

type DialogTriggerProps = DialogPrimitive.Trigger.Props & {
  asChild?: boolean
  children?: React.ReactNode
}
function DialogTrigger({ asChild, children, ...props }: DialogTriggerProps) {
  if (asChild && React.isValidElement(children)) {
    return (
      <DialogPrimitive.Trigger
        data-slot="dialog-trigger"
        render={children as React.ReactElement}
        {...(props as DialogPrimitive.Trigger.Props)}
      />
    )
  }
  return (
    <DialogPrimitive.Trigger
      data-slot="dialog-trigger"
      {...(props as DialogPrimitive.Trigger.Props)}
    >
      {children}
    </DialogPrimitive.Trigger>
  )
}

function DialogPortal({ ...props }: DialogPrimitive.Portal.Props) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({ ...props }: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-overlay"
      className={cn(
        "nds-dialog-overlay",
        className
      )}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: DialogPrimitive.Popup.Props & {
  showCloseButton?: boolean
}) {
  const modal = React.useContext(DialogModalContext)
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Popup
        data-slot="dialog-content"
        className={cn(
          "nds-dialog-content",
          className
        )}
        aria-modal={modal === true ? "true" : undefined}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            render={
              <Button
                variant="ghost"
                className="nds-dialog-close-position"
                size="icon-sm"
              />
            }
          >
            <XIcon
            />
            <span className="nds-sr-only">Fechar</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Popup>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("nds-dialog-header", className)}
      {...props}
    />
  )
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "nds-dialog-footer",
        className
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close render={<Button variant="outline" />}>
          Fechar
        </DialogPrimitive.Close>
      )}
    </div>
  )
}

function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn(
        "nds-dialog-title",
        className
      )}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        "nds-dialog-description",
        className
      )}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
