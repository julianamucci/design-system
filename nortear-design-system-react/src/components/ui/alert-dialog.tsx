import * as React from "react"
import { AlertDialog as AlertDialogPrimitive } from "@base-ui/react/alert-dialog"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

/*
 * ─── AlertDialog ────────────────────────────────────────────────────────────
 *
 * O modal que NÃO pode ser dispensado por engano. O bloco canônico da
 * divergência com o Dialog está no cabeçalho do `alert-dialog.ts` do Vanilla;
 * aqui fica a versão curta mais o mecanismo desta stack.
 *
 *   · PAPEL: `alertdialog`, e não `dialog` — o leitor de tela anuncia com
 *     urgência e lê a descrição junto do título.
 *   · CLIQUE NO VÉU NÃO FECHA. Mecanismo: `useRenderDialogRoot` liga
 *     `disablePointerDismissal` quando o modo é `'alert-dialog'`, e o
 *     `useDismiss` do Dialog consulta essa bandeira. Não é prop de quem
 *     consome: é o perfil do componente, fixado na construção.
 *   · ESCAPE FECHA, e equivale a cancelar — `escapeKey: isTopmost`, o mesmo
 *     do Dialog. Tirar a única saída de teclado seria pior que o risco de
 *     dispensa acidental, que o clique-fora bloqueado já cobre.
 *
 * Corolário: a saída visível é o par Cancel + Action do rodapé, e por isso o
 * rodapé não é opcional aqui — este componente não tem X no canto, ao
 * contrário do Dialog.
 *
 *   · FOCO INICIAL NO CANCELAR, por escolha do componente (D3 do PRD). O
 *     padrão da lib é o primeiro tabulável — que só coincidia com o Cancelar
 *     porque ele vem antes da ação no rodapé — e, na abertura por TOQUE, o
 *     próprio painel (`createDefaultInitialFocus`, para não subir o teclado
 *     virtual). Mecanismo: o Content cria uma ref, entrega-a ao Cancel por
 *     contexto e a passa em `initialFocus`. Sem Cancel montado a ref fica
 *     vazia, e a lib cai no comportamento padrão.
 */

/**
 * Ponte entre o Content, que decide o foco inicial, e o Cancel, que é o alvo.
 * Não exportado: é costura interna, e export extra num arquivo de componente
 * quebra o fast refresh.
 */
const AlertDialogCancelRefContext =
  React.createContext<React.RefObject<HTMLButtonElement | null> | null>(null)

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
  const cancelRef = React.useRef<HTMLButtonElement | null>(null)
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      {/*
        O primitivo desta stack isola o resto do documento com
        `inert`/`aria-hidden` e NÃO emite `aria-modal` (conferido em
        node_modules). Quem cumpre o contrato de markup do design system é este
        wrapper. Aqui o atributo é incondicional: a raiz do alert dialog não
        expõe `modal` — ela é sempre modal, por definição do papel.

        `initialFocus` vem ANTES do spread: é o padrão do componente, e quem
        consome ainda pode trocá-lo explicitamente.
      */}
      <AlertDialogCancelRefContext.Provider value={cancelRef}>
        <AlertDialogPrimitive.Popup
          data-slot="alert-dialog-content"
          className={cn(
            "nds-alert-dialog-content",
            className
          )}
          aria-modal="true"
          initialFocus={cancelRef}
          {...props}
        />
      </AlertDialogCancelRefContext.Provider>
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

// O Cancel pendura no botão a ref que o Content passa em `initialFocus` (D3),
// sem tomar o lugar da `ref` de quem consome: as duas recebem o mesmo nó.
function AlertDialogCancel({
  className,
  variant = "outline",
  size = "default",
  ref,
  ...props
}: AlertDialogPrimitive.Close.Props &
  Pick<React.ComponentProps<typeof Button>, "variant" | "size"> & {
    ref?: React.Ref<HTMLButtonElement>
  }) {
  const initialFocusRef = React.useContext(AlertDialogCancelRefContext)
  const composedRef = React.useCallback(
    (node: HTMLButtonElement | null) => {
      if (initialFocusRef) initialFocusRef.current = node
      if (typeof ref === "function") ref(node)
      else if (ref) ref.current = node
    },
    [initialFocusRef, ref]
  )
  return (
    <AlertDialogPrimitive.Close
      data-slot="alert-dialog-cancel"
      className={cn(className)}
      render={<Button variant={variant} size={size} />}
      ref={composedRef}
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
